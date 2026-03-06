import { readFile } from "fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerCanvasTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "create_frame",
    "Create a new frame in the Figma canvas. Prefer create_from_html for complex nested layouts. Use this for simple containers or when you need precise control.",
    {
      name: z.string().describe("Name of the frame"),
      width: z.number().describe("Frame width in pixels"),
      height: z.number().describe("Frame height in pixels"),
      x: z.number().optional().describe("X position (not needed when parentId has auto-layout)"),
      y: z.number().optional().describe("Y position (not needed when parentId has auto-layout)"),
      parentId: z.string().optional().describe("Parent node ID"),
      cornerRadius: z.number().optional().describe("Corner radius in pixels"),
      fillColor: z
        .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() })
        .optional()
        .describe("Background fill color (r/g/b 0–1, optional a 0–1)"),
      strokeColor: z
        .object({ r: z.number(), g: z.number(), b: z.number() })
        .optional()
        .describe("Stroke color (r/g/b 0–1)"),
      strokeWeight: z.number().optional().describe("Stroke weight in pixels"),
      layoutMode: z
        .enum(["HORIZONTAL", "VERTICAL"])
        .optional()
        .describe("Enable auto-layout: HORIZONTAL (row) or VERTICAL (column)"),
      paddingTop: z.number().optional(),
      paddingBottom: z.number().optional(),
      paddingLeft: z.number().optional(),
      paddingRight: z.number().optional(),
      itemSpacing: z.number().optional().describe("Gap between children in auto-layout"),
      primaryAxisAlignItems: z
        .enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"])
        .optional()
        .describe("Main axis alignment in auto-layout (MIN=start, CENTER=center, MAX=end, SPACE_BETWEEN)"),
      counterAxisAlignItems: z
        .enum(["MIN", "CENTER", "MAX"])
        .optional()
        .describe("Cross axis alignment in auto-layout (MIN=start, CENTER=center, MAX=end/stretch)"),
      primaryAxisSizingMode: z
        .enum(["FIXED", "AUTO"])
        .optional()
        .describe("How the frame sizes along its main axis: FIXED=explicit size, AUTO=hug contents"),
      counterAxisSizingMode: z
        .enum(["FIXED", "AUTO"])
        .optional()
        .describe("How the frame sizes along its cross axis: FIXED=explicit size, AUTO=hug contents"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_frame", params as Record<string, unknown>) as { id: string };

      const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
        { type: "text", text: JSON.stringify(result) },
      ];

      if (!params.parentId) {
        try {
          const exported = await bridge.sendCommand("export_node", { nodeId: result.id, format: "png", scale: 2 }) as { base64: string; mimeType: string };
          content.push({ type: "image", data: exported.base64, mimeType: exported.mimeType });
        } catch {
          // export is best-effort
        }
      }

      return { content };
    }
  );

  server.tool(
    "create_text",
    "Create a text node in the Figma canvas. Use get_used_fonts first to know which fonts are available in the file — prefer those over hardcoded names like Inter.",
    {
      characters: z.string().describe("Text content"),
      x: z.number().optional().describe("X position"),
      y: z.number().optional().describe("Y position"),
      parentId: z.string().optional().describe("Parent node ID"),
      fontSize: z.number().optional().describe("Font size in pixels"),
      fontFamily: z.string().optional().describe("Font family name"),
      fontWeight: z
        .string()
        .optional()
        .describe("Font weight style, e.g. Regular, Bold, SemiBold, Light"),
      color: z
        .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() })
        .optional()
        .describe("Text color (r/g/b 0–1, optional a 0–1)"),
      textAlign: z
        .enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"])
        .optional()
        .describe("Horizontal text alignment"),
      width: z.number().optional().describe("Fixed width for text wrapping"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_text", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_component_instance",
    "Create an instance of a published component by its key. Use find_components to discover component keys. Set properties immediately via the properties param to avoid an extra set_instance_properties call.",
    {
      componentKey: z.string().describe("The component's published key (from find_components)"),
      x: z.number().optional().describe("X position (not needed when parentId has auto-layout)"),
      y: z.number().optional().describe("Y position (not needed when parentId has auto-layout)"),
      parentId: z.string().optional().describe("Parent node ID"),
      properties: z
        .record(z.union([z.string(), z.boolean()]))
        .optional()
        .describe("Component property overrides to apply immediately (e.g. {Type: 'Primary', Label: 'Buy now'})"),
    },
    async (params) => {
      const result = await bridge.sendCommand(
        "create_component_instance",
        params as Record<string, unknown>
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "duplicate_node",
    "Duplicate an existing Figma node and place the copy next to the original or at a given position",
    {
      nodeId: z.string().describe("Node ID to duplicate"),
      x: z.number().optional().describe("X position for the duplicate (defaults to original x + width + 40)"),
      y: z.number().optional().describe("Y position for the duplicate (defaults to same y as original)"),
      parentId: z.string().optional().describe("Parent node ID for the duplicate (defaults to same parent)"),
    },
    async (params) => {
      const result = await bridge.sendCommand("duplicate_node", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_image_fill",
    "Set an image as the fill of a Figma node by providing a public image URL",
    {
      nodeId: z.string().describe("Target node ID"),
      imageUrl: z.string().optional().describe("Public URL of the image to use as fill"),
      localPath: z.string().optional().describe("Absolute local file path of the image to use as fill"),
      scaleMode: z
        .enum(["FILL", "FIT", "CROP", "TILE"])
        .optional()
        .describe("Image scale mode (default: FILL)"),
    },
    async (params) => {
      if (!params.imageUrl && !params.localPath) {
        throw new Error("Either imageUrl or localPath must be provided");
      }

      let imageBase64: string;

      if (params.localPath) {
        const fileBuffer = await readFile(params.localPath as string);
        imageBase64 = fileBuffer.toString("base64");
      } else {
        const response = await fetch(params.imageUrl as string);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        imageBase64 = Buffer.from(buffer).toString("base64");
      }

      const result = await bridge.sendCommand("set_image_fill", {
        nodeId: params.nodeId,
        imageBase64,
        scaleMode: params.scaleMode,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "bulk_update",
    "Apply multiple set_node_property operations in a single call. Returns per-node success/error results.",
    {
      updates: z
        .array(
          z.object({
            nodeId: z.string().describe("Target node ID"),
            property: z
              .enum([
                "name",
                "x",
                "y",
                "width",
                "height",
                "visible",
                "opacity",
                "fills",
                "strokes",
                "characters",
              ])
              .describe("Property to update"),
            value: z.any().describe("New value for the property"),
          })
        )
        .describe("Array of node property updates to apply"),
    },
    async (params) => {
      const result = await bridge.sendCommand("bulk_update", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_shape",
    "Create a primitive shape on the Figma canvas (RECTANGLE, ELLIPSE, POLYGON, STAR, LINE)",
    {
      type: z.enum(["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "LINE"]).describe("Shape type"),
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
      width: z.number().optional().describe("Width in pixels"),
      height: z.number().optional().describe("Height in pixels"),
      parentId: z.string().optional().describe("Parent node ID"),
      fillColor: z
        .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() })
        .optional()
        .describe("Fill color (r/g/b 0–1)"),
      strokeColor: z
        .object({ r: z.number(), g: z.number(), b: z.number() })
        .optional()
        .describe("Stroke color (r/g/b 0–1)"),
      strokeWeight: z.number().optional().describe("Stroke weight in pixels"),
      cornerRadius: z.number().optional().describe("Corner radius (RECTANGLE only)"),
      pointCount: z.number().optional().describe("Number of points (POLYGON or STAR)"),
      innerRadius: z.number().optional().describe("Inner radius 0–1 (STAR only)"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_shape", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_from_svg",
    "Import an SVG string directly as a Figma node. The AI can generate SVG markup for icons, illustrations, and shapes.",
    {
      svgString: z.string().describe("SVG markup string to import"),
      x: z.number().optional().describe("X position"),
      y: z.number().optional().describe("Y position"),
      parentId: z.string().optional().describe("Parent node ID"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_from_svg", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_effects",
    "Set visual effects (shadows and blurs) on a Figma node. Replaces all existing effects.",
    {
      nodeId: z.string().describe("Target node ID"),
      effects: z.array(
        z.object({
          type: z.enum(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"]),
          radius: z.number().describe("Blur/shadow radius"),
          color: z
            .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() })
            .optional()
            .describe("Shadow color (DROP_SHADOW and INNER_SHADOW only)"),
          offset: z
            .object({ x: z.number(), y: z.number() })
            .optional()
            .describe("Shadow offset (DROP_SHADOW and INNER_SHADOW only)"),
          spread: z.number().optional().describe("Shadow spread (DROP_SHADOW only)"),
          blendMode: z.string().optional().describe("Blend mode (default: NORMAL)"),
          visible: z.boolean().optional().describe("Whether the effect is visible (default: true)"),
        })
      ).describe("Array of effects to apply"),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_effects", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_fill",
    "Set fills on a Figma node with full support for solid colors and gradients. Replaces all existing fills.",
    {
      nodeId: z.string().describe("Target node ID"),
      fills: z.array(
        z.object({
          type: z.enum(["SOLID", "GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"]),
          color: z
            .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() })
            .optional()
            .describe("Color for SOLID fills"),
          opacity: z.number().optional().describe("Opacity 0–1 for SOLID fills"),
          gradientStops: z
            .array(
              z.object({
                position: z.number().describe("Stop position 0–1"),
                color: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() }),
              })
            )
            .optional()
            .describe("Color stops for gradient fills"),
          gradientTransform: z
            .array(z.array(z.number()))
            .optional()
            .describe("2x3 transform matrix for gradient direction"),
        })
      ).describe("Array of fills to apply"),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_fill", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_text_properties",
    "Set typography properties on a text node: letter spacing, line height, text decoration, text case, paragraph spacing.",
    {
      nodeId: z.string().describe("Target text node ID"),
      letterSpacing: z
        .object({ value: z.number(), unit: z.enum(["PIXELS", "PERCENT"]) })
        .optional()
        .describe("Letter spacing"),
      lineHeight: z
        .union([
          z.object({ value: z.number(), unit: z.enum(["PIXELS", "PERCENT"]) }),
          z.object({ unit: z.literal("AUTO") }),
        ])
        .optional()
        .describe("Line height"),
      textDecoration: z.enum(["NONE", "UNDERLINE", "STRIKETHROUGH"]).optional(),
      textCase: z.enum(["ORIGINAL", "UPPER", "LOWER", "TITLE"]).optional(),
      paragraphSpacing: z.number().optional().describe("Space between paragraphs in pixels"),
      textAlignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_text_properties", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "update_auto_layout",
    "Update auto-layout settings on an existing frame. Can enable auto-layout on a frame that doesn't have it yet.",
    {
      nodeId: z.string().describe("Target frame node ID"),
      layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional(),
      itemSpacing: z.number().optional().describe("Gap between children"),
      paddingTop: z.number().optional(),
      paddingBottom: z.number().optional(),
      paddingLeft: z.number().optional(),
      paddingRight: z.number().optional(),
      primaryAxisAlignItems: z.enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"]).optional(),
      counterAxisAlignItems: z.enum(["MIN", "CENTER", "MAX"]).optional(),
      layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional(),
      primaryAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional(),
      counterAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional(),
    },
    async (params) => {
      const result = await bridge.sendCommand("update_auto_layout", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

}
