import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerExportTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "export_node",
    "Export a Figma node as an image (PNG, SVG, or JPG). Returns the image inline so the AI can see it directly — no link needed. Call this after creating or editing nodes to visually confirm the result.",
    {
      nodeId: z.string().describe("Node ID to export"),
      format: z.enum(["png", "svg", "jpg"]).optional().describe("Image format (default: png)"),
      scale: z.number().optional().describe("Export scale multiplier (default: 2 for @2x)"),
    },
    async (params) => {
      const result = (await bridge.sendCommand("export_node", params as Record<string, unknown>)) as {
        base64: string;
        mimeType: string;
      };

      if (params.format === "svg") {
        const svgText = Buffer.from(result.base64, "base64").toString("utf-8");
        return { content: [{ type: "text" as const, text: svgText }] };
      }

      return {
        content: [{ type: "image" as const, data: result.base64, mimeType: result.mimeType }],
      };
    }
  );

  server.tool(
    "export_page",
    "Export the entire current Figma page as a single image showing all frames together. Returns the image inline so the AI can see the full canvas layout at once. Use this to get a birds-eye view of the design.",
    {
      format: z.enum(["png", "jpg"]).optional().describe("Image format (default: png)"),
      scale: z.number().optional().describe("Export scale multiplier (default: 0.5 for overview)"),
    },
    async (params) => {
      const result = (await bridge.sendCommand("export_page", params as Record<string, unknown>)) as {
        base64: string;
        mimeType: string;
      };
      return {
        content: [{ type: "image" as const, data: result.base64, mimeType: result.mimeType }],
      };
    }
  );

  server.tool(
    "export_batch",
    "Export multiple Figma nodes as images in a single call. Returns each image inline so the AI can see them directly. Call this after creating a flow of screens to do a final visual review.",
    {
      nodeIds: z.array(z.string()).describe("Node IDs to export"),
      format: z.enum(["png", "svg", "jpg"]).optional().describe("Image format (default: png)"),
      scale: z.number().optional().describe("Export scale multiplier (default: 2)"),
    },
    async (params) => {
      const results = (await bridge.sendCommand("export_batch", params as Record<string, unknown>)) as Array<{
        nodeId: string;
        base64: string;
        mimeType: string;
      }>;

      const content: Array<
        { type: "text"; text: string } | { type: "image"; data: string; mimeType: string }
      > = [];

      for (const item of results) {
        content.push({ type: "text", text: `Node: ${item.nodeId}` });
        if (params.format === "svg") {
          const svgText = Buffer.from(item.base64, "base64").toString("utf-8");
          content.push({ type: "text", text: svgText });
        } else {
          content.push({ type: "image", data: item.base64, mimeType: item.mimeType });
        }
      }

      return { content };
    }
  );
}
