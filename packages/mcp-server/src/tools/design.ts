import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerDesignTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "get_design_system_kit",
    `ALWAYS call this before creating any screen, component, or layout. Returns the complete design system context from the current Figma file in a single call — fonts, colors, text styles, variables, and effects.

Returns:
- variableCollections: all token collections with modes and values
- colorStyles: local paint/color styles with their paints
- textStyles: typography styles (fontSize, fontName, lineHeight, etc.) — local only; use get_linked_library_tokens for styles from external libraries
- effectStyles: shadow and blur styles
- fonts: all font families and weights used on the current page
- linkedTokens: text styles and color variables from connected external libraries (Boreal Foundations, FFP Design System, etc.)
- summary: counts of each category

Also automatically exports a screenshot of the entire current page so you can understand the project's visual style and layout before creating anything new.

This replaces calling get_variable_collections + get_variables + get_local_styles + get_used_fonts separately.`,
    {},
    async () => {
      const kit = await bridge.sendCommand("get_design_system_kit", {});

      let linkedTokens: unknown = null;
      try {
        linkedTokens = await bridge.sendCommand("get_all_used_styles", {});
      } catch { /* best-effort */ }

      const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
        { type: "text", text: JSON.stringify({ ...kit as object, linkedTokens }) },
      ];

      try {
        content.push({ type: "text", text: "Current page overview:" });
        const exported = await bridge.sendCommand("export_page", { format: "png", scale: 0.5 }) as { base64: string; mimeType: string };
        content.push({ type: "image", data: exported.base64, mimeType: exported.mimeType });
      } catch {
        // screenshot is best-effort — don't fail if page is empty
      }

      return { content };
    }
  );

  server.tool(
    "get_linked_library_tokens",
    `Get text styles and color variables from ALL connected external design system libraries (e.g. Boreal Foundations, FFP Design System - Mobile, Hangar Web).

Call this when you need the exact style IDs for typography tokens like "Body/Body Large", "Heading/H1", etc., or color variable names.

Returns:
- textStyles: array of { id, name, fontSize, fontFamily, fontStyle, lineHeight, letterSpacing }
  — name examples: "Body/Body Large", "Heading/H1", "Label/Small"
  — id is the Figma style ID you can use with data-text-style-id in create_from_html
- colorVariables: array of { id, name, collection, resolvedType, value }
  — name examples: "brand/primary", "neutral/white", "feedback/success"

Use these IDs in create_from_html with data-text-style-id to apply real token bindings instead of raw CSS values.`,
    {
      maxFrames: z.number().optional().describe("How many frames to scan for styles (default: 5)"),
    },
    async (params) => {
      const result = await bridge.sendCommand("get_all_used_styles", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "find_components_in_page",
    `Scan the current Figma page and return ALL component instances grouped by component set — including components from connected external libraries.

Use this BEFORE creating any screen or UI element to discover what real Figma components are available. Never guess or hardcode component keys.

Returns an array of component groups, each with:
- setName: the component set name (e.g. "Button", "Input Text", "BottomSheet")
- isRemote: true if the component comes from a linked external library
- components: array of variants, each with key, name (variant props), and dimensions (w, h)

After getting the list, call get_component_properties with a component key to understand its props (text overrides, variant options, booleans).

Workflow:
1. Call find_components_in_page → get available component names and keys
2. Call get_component_properties on the key you want to use → get prop names and valid values
3. Use the key in create_from_html with data-component-key, or via create_component_instance

To discover components from a library file not yet used on this page, call find_components with that file's fileKey (from its Figma URL).`,
    {
      pageId: z.string().optional().describe("Page ID to scan (defaults to current page)"),
    },
    async (params) => {
      const result = await bridge.sendCommand("get_page_components", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_file_context",
    `Get a complete visual overview of ALL pages in the current Figma file. For each page, returns its name, frame count, and a screenshot of its full canvas.

Use this when you need to understand the full scope of an existing project before creating something new — it lets you see every page's design at once and decide where best to add new content.

After calling this, you will know:
- Which pages exist and what they contain
- The visual style and design patterns used across the entire file
- Where to place new screens (which existing page fits, or if a new page is needed)

The active page is restored to the original after scanning.`,
    {
      scale: z.number().optional().describe("Export scale multiplier for screenshots (default: 0.3 for overview)"),
    },
    async (params) => {
      const results = (await bridge.sendCommand("get_file_context", params as Record<string, unknown>)) as Array<{
        pageId: string;
        pageName: string;
        frameCount: number;
        base64?: string;
      }>;

      const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];

      for (const page of results) {
        content.push({ type: "text", text: `Page: "${page.pageName}" (${page.frameCount} frames, id: ${page.pageId})` });
        if (page.base64) {
          content.push({ type: "image", data: page.base64, mimeType: "image/png" });
        }
      }

      return { content };
    }
  );

  server.tool(
    "execute",
    `Run arbitrary Figma Plugin API code directly. The code runs inside an async function with access to the \`figma\` global and a \`console\` object that captures logs.

Use this as an escape hatch for operations not covered by other tools, or to batch multiple operations efficiently.

The code must be valid JavaScript/TypeScript that can run in the Figma plugin environment.
Return a value with \`return\` to get it back in the result field.

EXAMPLES:

// Move all frames on the current page down by 100px
const frames = figma.currentPage.children.filter(n => n.type === 'FRAME');
for (const f of frames) f.y += 100;
return frames.length;

// Get bounding box of current page
const nodes = figma.currentPage.children;
const xs = nodes.map(n => n.x);
const ys = nodes.map(n => n.y);
return { minX: Math.min(...xs), minY: Math.min(...ys) };

// Rename all text nodes matching a pattern
const texts = figma.currentPage.findAll(n => n.type === 'TEXT');
let count = 0;
for (const t of texts) {
  if (t.name === 'Label') { t.name = 'Text/Label'; count++; }
}
return { renamed: count };

LIMITATIONS:
- Cannot use import/require
- Cannot access external APIs or the filesystem
- Async operations with figma.importComponentByKeyAsync etc. are supported`,
    {
      code: z.string().describe("JavaScript code to execute in the Figma plugin context"),
    },
    async (params) => {
      const result = await bridge.sendCommand("execute", params as Record<string, unknown>, 60_000);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );
}
