import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parse, HTMLElement as NHTMLElement, Node } from "node-html-parser";
import { Bridge } from "../bridge.js";

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface FigmaNode {
  type: "FRAME" | "TEXT" | "INSTANCE";
  name?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cornerRadius?: number;
  fills?: Array<{ type: string; color: FigmaColor; opacity?: number } | { type: string; gradientStops?: unknown[]; gradientTransform?: unknown }>;
  strokes?: Array<{ type: string; color: FigmaColor }>;
  strokeWeight?: number;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  itemSpacing?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  opacity?: number;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  color?: FigmaColor;
  children?: FigmaNode[];
  clipsContent?: boolean;
  componentKey?: string;
  instanceProps?: Record<string, string | boolean>;
  textStyleId?: string;
}

function parseColor(value: string): FigmaColor | null {
  value = value.trim();
  const hex3 = value.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const [, h] = hex3;
    return { r: parseInt(h[0] + h[0], 16) / 255, g: parseInt(h[1] + h[1], 16) / 255, b: parseInt(h[2] + h[2], 16) / 255 };
  }
  const hex6 = value.match(/^#([0-9a-f]{6})$/i);
  if (hex6) {
    const [, h] = hex6;
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
  }
  const hex8 = value.match(/^#([0-9a-f]{8})$/i);
  if (hex8) {
    const [, h] = hex8;
    return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: parseInt(h.slice(6, 8), 16) / 255 };
  }
  const rgba = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgba) {
    return { r: parseFloat(rgba[1]) / 255, g: parseFloat(rgba[2]) / 255, b: parseFloat(rgba[3]) / 255, a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1 };
  }
  const namedColors: Record<string, FigmaColor> = {
    white: { r: 1, g: 1, b: 1 }, black: { r: 0, g: 0, b: 0 },
    transparent: { r: 0, g: 0, b: 0, a: 0 }, red: { r: 1, g: 0, b: 0 },
    blue: { r: 0, g: 0, b: 1 }, green: { r: 0, g: 0.502, b: 0 },
    gray: { r: 0.502, g: 0.502, b: 0.502 }, grey: { r: 0.502, g: 0.502, b: 0.502 },
  };
  return namedColors[value.toLowerCase()] ?? null;
}

type GradientFill = { type: string; gradientStops: unknown[]; gradientTransform: number[][] };

function parseCssGradient(value: string): GradientFill | null {
  const match = value.match(/linear-gradient\((.+)\)\s*$/s);
  if (!match) return null;

  const tokens = splitTopLevel(match[1]);
  let angleDeg = 180;
  let stopTokens = tokens;

  const first = tokens[0]?.trim() ?? "";
  if (first.endsWith("deg")) {
    angleDeg = parseFloat(first);
    stopTokens = tokens.slice(1);
  } else if (first.startsWith("to ")) {
    const dir = first.slice(3).trim();
    const dirMap: Record<string, number> = {
      "top": 0, "right": 90, "bottom": 180, "left": 270,
      "top right": 45, "right top": 45,
      "bottom right": 135, "right bottom": 135,
      "bottom left": 225, "left bottom": 225,
      "top left": 315, "left top": 315,
    };
    angleDeg = dirMap[dir] ?? 180;
    stopTokens = tokens.slice(1);
  }

  const stops = stopTokens.map((stopStr, index) => {
    const parts = stopStr.trim().split(/\s+(?![^(]*\))/);
    const colorStr = parts[0];
    const color = parseColor(colorStr ?? "");
    if (!color) return null;
    const posStr = parts[1];
    const pos = posStr?.endsWith("%")
      ? parseFloat(posStr) / 100
      : index / Math.max(stopTokens.length - 1, 1);
    return { position: pos, color: { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 } };
  }).filter((s): s is NonNullable<typeof s> => s !== null);

  if (stops.length < 2) return null;

  const rad = (angleDeg * Math.PI) / 180;
  const sinA = Math.sin(rad);
  const cosA = Math.cos(rad);
  const gradientTransform = [
    [sinA, cosA, 0.5 * (1 - sinA)],
    [-cosA, sinA, 0.5 * (1 + cosA)],
  ];

  return { type: "GRADIENT_LINEAR", gradientStops: stops, gradientTransform };
}

function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of str) {
    if (ch === "(") { depth++; current += ch; }
    else if (ch === ")") { depth--; current += ch; }
    else if (ch === "," && depth === 0) { parts.push(current); current = ""; }
    else { current += ch; }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseBorderSide(value: string): { color: FigmaColor; width: number } | null {
  const m = value.match(/([\d.]+)px\s+\w+\s+(.+)/);
  if (!m) return null;
  const width = parseFloat(m[1]);
  const color = parseColor(m[2].trim());
  if (!color) return null;
  return { color, width };
}

function parsePx(value: string): number | undefined {
  const m = value.match(/^([\d.]+)(?:px)?$/);
  return m ? parseFloat(m[1]) : undefined;
}

function parsePadding(value: string): { top: number; right: number; bottom: number; left: number } {
  const parts = value.trim().split(/\s+/).map((v) => parsePx(v) ?? 0);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

function parseStyles(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const decl of styleStr.split(";")) {
    const colon = decl.indexOf(":");
    if (colon === -1) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).trim();
    if (prop && val) result[prop] = val;
  }
  return result;
}

function fontWeightToStyle(weight: string): string {
  const n = parseInt(weight);
  if (!isNaN(n)) {
    if (n >= 800) return "ExtraBold";
    if (n >= 700) return "Bold";
    if (n >= 600) return "SemiBold";
    if (n >= 500) return "Medium";
    if (n <= 300) return "Light";
    return "Regular";
  }
  if (weight === "bold") return "Bold";
  if (weight === "bolder") return "Bold";
  return "Regular";
}

function convertElement(el: Node, inheritedStyles: Record<string, string> = {}): FigmaNode | null {
  if (el.nodeType === 3) {
    const text = el.rawText?.trim();
    if (!text) return null;
    const color = parseColor(inheritedStyles["color"] ?? "black");
    const fontSize = parsePx(inheritedStyles["font-size"] ?? "14px") ?? 14;
    const fontFamily = (inheritedStyles["font-family"] ?? "Inter").split(",")[0].trim().replace(/['"]/g, "");
    const fontWeight = fontWeightToStyle(inheritedStyles["font-weight"] ?? "400");
    const textAlign = (inheritedStyles["text-align"] ?? "left").toUpperCase() as "LEFT" | "CENTER" | "RIGHT";
    return {
      type: "TEXT",
      characters: text,
      fontSize,
      fontFamily,
      fontWeight,
      textAlign,
      color: color ?? { r: 0, g: 0, b: 0 },
    };
  }

  if (el.nodeType !== 1) return null;
  const elem = el as NHTMLElement;
  const tag = (elem.tagName ?? "div").toLowerCase();

  if (["script", "style", "head", "meta", "link"].includes(tag)) return null;

  const componentKey = elem.getAttribute("data-component-key");
  if (componentKey) {
    const propsStr = elem.getAttribute("data-props");
    const instanceProps = propsStr ? (JSON.parse(propsStr) as Record<string, string | boolean>) : undefined;
    const styleStr = elem.getAttribute("style") ?? "";
    const styles = { ...inheritedStyles, ...parseStyles(styleStr) };
    const node: FigmaNode = { type: "INSTANCE", componentKey, instanceProps };
    const width = parsePx(styles["width"] ?? "");
    const height = parsePx(styles["height"] ?? "");
    if (width !== undefined) node.width = width;
    if (height !== undefined) node.height = height;
    node.name = elem.getAttribute("data-name") ?? elem.getAttribute("id") ?? undefined;
    return node;
  }

  const styleStr = elem.getAttribute("style") ?? "";
  const styles = { ...inheritedStyles, ...parseStyles(styleStr) };

  const isTextTag = ["span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "label", "a", "strong", "em", "small"].includes(tag);
  const isInlineText = isTextTag && elem.childNodes.every((c) => c.nodeType === 3);

  if (isInlineText) {
    const text = elem.innerText?.trim() ?? "";
    if (!text) return null;
    const color = parseColor(styles["color"] ?? inheritedStyles["color"] ?? "black");
    const fontSize = parsePx(styles["font-size"] ?? "14px") ?? 14;
    const fontFamily = (styles["font-family"] ?? "Inter").split(",")[0].trim().replace(/['"]/g, "");
    const fontWeight = fontWeightToStyle(styles["font-weight"] ?? "400");
    const textAlign = (styles["text-align"] ?? "left").toUpperCase() as "LEFT" | "CENTER" | "RIGHT";
    const opacity = styles["opacity"] ? parseFloat(styles["opacity"]) : undefined;
    const width = parsePx(styles["width"] ?? "");
    const flexGrow = parseFloat(styles["flex-grow"] ?? styles["flex"] ?? "0");
    const fillH = styles["width"] === "100%" || (!isNaN(flexGrow) && flexGrow > 0);
    const fillV = styles["height"] === "100%" || styles["align-self"] === "stretch";
    const textStyleId = elem.getAttribute("data-text-style-id") ?? undefined;
    return {
      type: "TEXT",
      characters: text,
      fontSize,
      fontFamily,
      fontWeight,
      textAlign,
      color: color ?? { r: 0, g: 0, b: 0 },
      opacity,
      width,
      layoutSizingHorizontal: fillH ? "FILL" : undefined,
      layoutSizingVertical: fillV ? "FILL" : undefined,
      textStyleId,
    };
  }

  const node: FigmaNode = { type: "FRAME", children: [] };
  node.name = elem.getAttribute("data-name") ?? elem.getAttribute("id") ?? tag;

  const width = parsePx(styles["width"] ?? "");
  const height = parsePx(styles["height"] ?? "");

  const display = styles["display"] ?? "block";
  const flexDir = styles["flex-direction"] ?? "row";
  const isVertical = display !== "flex" && display !== "inline-flex" ? true : flexDir === "column";

  node.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";

  if (isVertical) {
    // VERTICAL: primary axis = height, counter axis = width
    if (width !== undefined) { node.width = width; node.counterAxisSizingMode = "FIXED"; }
    else node.counterAxisSizingMode = "AUTO";
    if (height !== undefined) { node.height = height; node.primaryAxisSizingMode = "FIXED"; }
    else node.primaryAxisSizingMode = "AUTO";
  } else {
    // HORIZONTAL: primary axis = width, counter axis = height
    if (width !== undefined) { node.width = width; node.primaryAxisSizingMode = "FIXED"; }
    else node.primaryAxisSizingMode = "AUTO";
    if (height !== undefined) { node.height = height; node.counterAxisSizingMode = "FIXED"; }
    else node.counterAxisSizingMode = "AUTO";
  }

  if (display === "flex" || display === "inline-flex") {
    const justifyContent = styles["justify-content"] ?? "flex-start";
    const alignItems = styles["align-items"] ?? "flex-start";
    const justifyMap: Record<string, FigmaNode["primaryAxisAlignItems"]> = {
      "flex-start": "MIN", "flex-end": "MAX", "center": "CENTER", "space-between": "SPACE_BETWEEN",
    };
    const alignMap: Record<string, FigmaNode["counterAxisAlignItems"]> = {
      "flex-start": "MIN", "flex-end": "MAX", "center": "CENTER",
    };
    node.primaryAxisAlignItems = justifyMap[justifyContent] ?? "MIN";
    node.counterAxisAlignItems = alignMap[alignItems] ?? "MIN";
    const gap = parsePx(styles["gap"] ?? styles["column-gap"] ?? styles["row-gap"] ?? "");
    if (gap !== undefined) node.itemSpacing = gap;
  } else {
    node.primaryAxisAlignItems = "MIN";
    node.counterAxisAlignItems = "MIN";
  }

  const padding = styles["padding"];
  if (padding) {
    const p = parsePadding(padding);
    node.paddingTop = p.top; node.paddingBottom = p.bottom;
    node.paddingLeft = p.left; node.paddingRight = p.right;
  } else {
    const pt = parsePx(styles["padding-top"] ?? "");
    const pb = parsePx(styles["padding-bottom"] ?? "");
    const pl = parsePx(styles["padding-left"] ?? "");
    const pr = parsePx(styles["padding-right"] ?? "");
    if (pt !== undefined) node.paddingTop = pt;
    if (pb !== undefined) node.paddingBottom = pb;
    if (pl !== undefined) node.paddingLeft = pl;
    if (pr !== undefined) node.paddingRight = pr;
  }

  const bg = styles["background"] ?? styles["background-color"] ?? "";
  if (bg && bg !== "transparent" && bg !== "none") {
    if (bg.includes("gradient")) {
      const gradient = parseCssGradient(bg);
      if (gradient) node.fills = [gradient];
    } else {
      const color = parseColor(bg);
      if (color) node.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: color.a ?? 1 }];
    }
  } else if (!bg || bg === "transparent") {
    node.fills = [];
  }

  const border = styles["border"];
  const borderColor = styles["border-color"];
  const borderWidth = parsePx(styles["border-width"] ?? "");
  const borderTop = styles["border-top"];
  const borderBottom = styles["border-bottom"];
  const borderLeft = styles["border-left"];
  const borderRight = styles["border-right"];

  const directionalBorder = borderTop ?? borderBottom ?? borderLeft ?? borderRight;

  if (border || borderColor) {
    const bColorStr = borderColor ?? border?.replace(/\d+px\s+\w+\s+/, "") ?? "";
    const bColor = parseColor(bColorStr.trim());
    if (bColor) {
      node.strokes = [{ type: "SOLID", color: bColor }];
      node.strokeWeight = borderWidth ?? (border ? parsePx(border.split(" ")[0]) ?? 1 : 1);
    }
  } else if (directionalBorder) {
    const parsed = parseBorderSide(directionalBorder);
    if (parsed) {
      node.strokes = [{ type: "SOLID", color: parsed.color }];
      node.strokeWeight = parsed.width;
    }
  }

  const opacity = styles["opacity"];
  if (opacity) node.opacity = parseFloat(opacity);

  const borderRadius = styles["border-radius"] ?? "";
  if (borderRadius) {
    const radius = borderRadius.endsWith("%") ? 9999 : (parsePx(borderRadius) ?? 0);
    node.cornerRadius = radius;
  }

  const flexGrow = parseFloat(styles["flex-grow"] ?? styles["flex"] ?? "0");
  const fillH = styles["width"] === "100%" || (!isNaN(flexGrow) && flexGrow > 0);
  const fillV = styles["height"] === "100%" || styles["align-self"] === "stretch";
  if (fillH) node.layoutSizingHorizontal = "FILL";
  if (fillV) node.layoutSizingVertical = "FILL";

  const inheritText: Record<string, string> = {};
  if (styles["color"]) inheritText["color"] = styles["color"];
  if (styles["font-size"]) inheritText["font-size"] = styles["font-size"];
  if (styles["font-family"]) inheritText["font-family"] = styles["font-family"];
  if (styles["font-weight"]) inheritText["font-weight"] = styles["font-weight"];
  if (styles["text-align"]) inheritText["text-align"] = styles["text-align"];

  for (const child of elem.childNodes) {
    const childNode = convertElement(child, inheritText);
    if (childNode) node.children!.push(childNode);
  }

  if (node.children!.length === 0) delete node.children;

  return node;
}

function htmlToFigmaTree(htmlStr: string): FigmaNode {
  const root = parse(htmlStr);
  const body = root.querySelector("body") ?? root;
  const first = body.childNodes.find((n) => n.nodeType === 1) as NHTMLElement | undefined;
  if (!first) throw new Error("No root element found in HTML");
  const node = convertElement(first);
  if (!node) throw new Error("Could not convert root element");
  return node;
}

export function registerHtmlTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "create_from_html",
    `Convert an HTML string (with inline CSS) into NATIVE Figma nodes with real auto-layout. Each HTML element becomes an editable Figma frame or text node — fully inspectable and modifiable in Figma, unlike SVG imports.

MANDATORY WORKFLOW — follow this every time before creating any screen or layout:
1. Call get_design_system_kit — returns fonts, colors, tokens AND a screenshot of existing screens to understand the visual style. Also returns linkedTokens with text styles and color variables from connected external libraries.
2. Call find_components_in_page — returns ALL available Figma components (including from linked libraries) with their keys and variant names. NEVER assume what components exist; always discover them first.
3. For each component you want to use, call get_component_properties with its key to learn the exact prop names and valid values.
4. Use ONLY the font families returned by get_design_system_kit. Prefer design system tokens (text styles and color variables) over raw CSS values.
5. After creating all nodes, this tool automatically returns a screenshot. Review it carefully — fix any issues and export again.

LAYOUT RULES:
- Use display:flex for layout containers. This maps to Figma auto-layout.
- flex-direction:row → HORIZONTAL auto-layout; flex-direction:column → VERTICAL auto-layout
- align-items → counterAxisAlignItems; justify-content → primaryAxisAlignItems
- gap → itemSpacing; padding → frame padding
- width:100% or flex-grow:1 → FILL container (child fills parent)
- border-radius:50% → cornerRadius:9999 (circle)
- Children of display:flex;flex-direction:column automatically FILL parent width (CSS default stretch). No need to add width:100% to children of a column — they fill automatically.
- justify-content:space-between works correctly when the parent has an explicit width OR when the element is a child of a column (auto-fills).

FONTS AND TYPOGRAPHY TOKENS:
- Call get_used_fonts FIRST to discover which font families the file already uses (e.g. "Latam Sans", "Inter").
- Use those exact family names in font-family style (e.g. style="font-family:Latam Sans;font-weight:700").
- If a font is unavailable, it falls back automatically to Regular of the same family, then to Inter Regular.
- Colors: hex (#1B0088), rgb(), rgba(), named (white, black, gray).

TEXT STYLE TOKENS (PRIORITY — use these instead of raw font-size/weight):
get_design_system_kit returns linkedTokens.textStyles from external libraries. Each entry has an id and name (e.g. "Body/Body Large", "Heading/H1", "Label/Small").
ALWAYS prefer using these tokens over hardcoded font-size/font-weight values.

To apply a text style token to a text element, add the data-text-style-id attribute:
  <span data-text-style-id="S:abc123,...">text content</span>

The font-size and font-weight in the style attribute serve as visual fallbacks in case the binding fails — set them to match the token values.

Example using a typography token:
  <!-- get_design_system_kit returned: { id: "S:7ab3c,...", name: "Body/Body Large", fontSize: 16, fontStyle: "Regular" } -->
  <span data-text-style-id="S:7ab3c,..." style="font-size:16px;font-family:Latam Sans">Description text</span>

GRADIENTS:
CSS linear-gradient is fully supported in background style:
  style="background:linear-gradient(to bottom, #1B0088, #ED162B)"
  style="background:linear-gradient(135deg, #0F004F 0%, #1B0088 60%, #ED162B 100%)"
Directions: to top, to right, to bottom, to left, to bottom right, etc. Also accepts degrees: 90deg, 180deg.

DIRECTIONAL BORDERS:
border-top, border-bottom, border-left, border-right are all supported:
  style="border-top:1px solid #E8E8E8"

LIMITATIONS (not supported):
- CSS transform (rotate, scale, translate) — use SVG for rotated shapes
- CSS animations/transitions
- overflow:hidden / clip
- For checkmarks/icons, use Unicode characters (✓ ✕ ★) or create_from_svg, NOT CSS transforms
- max-width, min-width, max-height, min-height

COMPONENT INSTANCES — MANDATORY RULE:
⚠️ NEVER recreate as plain HTML any element that exists as a Figma component. Buttons, inputs, checkboxes, alerts, headers, bottom sheets, accordions, tabs, nav bars — ALL must be real component instances. Plain divs break the design system link.

Step 1 — Discover: call find_components_in_page to get all available components and their keys. This includes components from any connected Figma library. Never assume what's available.

Step 2 — Inspect: call get_component_properties with the component key to get the exact prop names and valid variant values.

Step 3 — Use: insert components via data-component-key in HTML, or via create_component_instance for components that must live outside the HTML tree (Status Bar, Header, BottomSheet at root level).

Syntax (inside HTML):
<div data-component-key="KEY" data-props='{"PropName": "value", "BoolProp": true}'></div>

Rules:
- Text overrides: use the exact prop name from get_component_properties (e.g. "Label#342:50", "Text#2335:11")
- Variant props: use exact string values from variantOptions (e.g. "Type": "Primary")
- Boolean props: use JSON true/false (not strings)
- Components that are 360px wide and structural (Status Bar, Header, BottomSheet) should be created via create_component_instance at the frame root level, not inside the HTML layout

If find_components_in_page returns no results on the current page, switch to a page that has the design system in use, or call find_components (REST API) with the library file key from its Figma URL.

EXAMPLES:

Circle with centered text:
<div style="width:36px;height:36px;border-radius:50%;background:#1B0088;display:flex;align-items:center;justify-content:center;">
  <span style="color:white;font-size:16px;font-weight:700">1</span>
</div>

Vertical card with gap (replace BUTTON_KEY with the key from find_components_in_page):
<div style="width:312px;display:flex;flex-direction:column;gap:16px;background:white;border-radius:16px;padding:24px;">
  <span style="font-size:22px;font-weight:700;color:#0F004F">Title</span>
  <span style="font-size:14px;color:#616161">Subtitle text</span>
  <div data-component-key="BUTTON_KEY" data-props='{"Type":"Primary","Label#342:50":"Action"}'></div>
</div>

Row with fill child:
<div style="width:100%;display:flex;flex-direction:row;gap:8px;align-items:center;">
  <span style="font-size:14px;color:#0F004F;flex:1">Text that fills</span>
  <span style="font-size:12px;color:#616161">Right label</span>
</div>`,
    {
      html: z.string().describe("HTML string with inline styles to render as a Figma node"),
      x: z.number().optional().describe("X position on canvas"),
      y: z.number().optional().describe("Y position on canvas"),
      parentId: z.string().optional().describe("Parent node ID"),
    },
    async (params) => {
      const tree = htmlToFigmaTree(params.html as string);
      const result = await bridge.sendCommand("create_tree", {
        tree,
        x: params.x,
        y: params.y,
        parentId: params.parentId,
      }) as { id: string };

      const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
        { type: "text", text: JSON.stringify(result) },
      ];

      try {
        const exported = await bridge.sendCommand("export_node", { nodeId: result.id, format: "png", scale: 2 }) as { base64: string; mimeType: string };
        content.push({ type: "image", data: exported.base64, mimeType: exported.mimeType });
      } catch {
        // export is best-effort — don't fail the whole creation if screenshot fails
      }

      return { content };
    }
  );
}
