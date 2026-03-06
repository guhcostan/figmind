import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerNodeTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "get_selection",
    "Get the nodes currently selected by the user in Figma. Returns full serialized node data for each selected node. Use this when the user says 'this', 'the selected', 'current frame', etc.",
    {},
    async () => {
      const result = await bridge.sendCommand("get_selection", {});
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_node",
    "Get a Figma node by ID including type, name, position, text content, font, and fills",
    {
      nodeId: z.string().describe("Node ID to retrieve"),
    },
    async (params) => {
      const result = await bridge.sendCommand("get_node", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_full_tree",
    "Get a Figma node and its entire descendant tree with rich properties (characters, fills, fontName, fontSize). Use depth to control how deep to recurse.",
    {
      nodeId: z.string().describe("Root node ID"),
      depth: z.number().optional().describe("Max recursion depth (default: 10)"),
    },
    async (params) => {
      const result = await bridge.sendCommand("get_full_tree", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "find_nodes",
    "Search recursively for nodes matching filters. Use textContains to find text nodes by content, nameContains to match by layer name, or type to filter by node type (TEXT, FRAME, etc.).",
    {
      nodeId: z.string().optional().describe("Root node ID to search within (defaults to current page)"),
      textContains: z
        .string()
        .optional()
        .describe("Filter TEXT nodes whose characters contain this string (case-insensitive)"),
      nameContains: z
        .string()
        .optional()
        .describe("Filter nodes whose name contains this string (case-insensitive)"),
      type: z
        .string()
        .optional()
        .describe("Filter by node type e.g. TEXT, FRAME, GROUP, INSTANCE"),
    },
    async (params) => {
      const result = await bridge.sendCommand("find_nodes", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "delete_nodes",
    "Delete multiple Figma nodes at once by ID. Use this to batch-clean orphan nodes left by failed or timed-out operations.",
    {
      nodeIds: z.array(z.string()).describe("Array of node IDs to delete"),
    },
    async (params) => {
      const result = await bridge.sendCommand("delete_nodes", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "move_node",
    "Move a node to a different parent container",
    {
      nodeId: z.string().describe("Node ID to move"),
      parentId: z.string().describe("Destination parent node ID"),
      index: z.number().optional().describe("Position index within the parent"),
    },
    async (params) => {
      const result = await bridge.sendCommand("move_node", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_used_fonts",
    "Get all fonts actually used in the current Figma page. Call this before creating text or using create_from_html to know which font families and styles are available in the design system (e.g. 'Latam Sans Bold', 'Inter Regular'). Always prefer these over hardcoded font names.",
    {},
    async () => {
      const result = await bridge.sendCommand("get_used_fonts", {});
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

}
