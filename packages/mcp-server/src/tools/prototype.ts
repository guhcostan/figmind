import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerPrototypeTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "set_reactions",
    "Add prototype interactions to a node (e.g. ON_CLICK → navigate to another frame). This is what makes a design a navigable prototype.",
    {
      nodeId: z.string().describe("Source node ID (the element the user interacts with)"),
      reactions: z.array(
        z.object({
          trigger: z
            .enum(["ON_CLICK", "ON_HOVER", "ON_PRESS", "MOUSE_ENTER", "MOUSE_LEAVE", "AFTER_TIMEOUT"])
            .describe("What triggers the interaction"),
          destinationId: z
            .string()
            .optional()
            .describe("Target frame/node ID to navigate to (omit for BACK action)"),
          navigation: z
            .enum(["NAVIGATE", "OVERLAY", "SWAP", "SCROLL_TO"])
            .optional()
            .describe("Navigation type (default: NAVIGATE)"),
          transition: z
            .object({
              type: z
                .enum(["DISSOLVE", "SMART_ANIMATE", "MOVE_IN", "MOVE_OUT", "PUSH", "SLIDE_IN", "SLIDE_OUT"])
                .describe("Transition animation type"),
              duration: z.number().describe("Duration in seconds (e.g. 0.3)"),
              easing: z
                .enum(["EASE_IN", "EASE_OUT", "EASE_IN_AND_OUT", "LINEAR"])
                .describe("Easing function"),
            })
            .optional()
            .describe("Animation transition (optional — omit for instant)"),
        })
      ).describe("Array of reactions to set on the node"),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_reactions", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_pages",
    "List all pages in the current Figma file with their IDs, names, and frame count.",
    {},
    async () => {
      const result = await bridge.sendCommand("get_pages", {});
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_page",
    "Create a new page in the Figma file",
    {
      name: z.string().describe("Name for the new page"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_page", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_current_page",
    "Switch the active page in Figma by page ID. Use get_pages to find page IDs.",
    {
      pageId: z.string().describe("Page node ID to switch to"),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_current_page", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "scroll_into_view",
    "Scroll and zoom the Figma viewport to center on one or more nodes. Useful after creating elements to confirm them visually.",
    {
      nodeIds: z.array(z.string()).describe("Node IDs to scroll into view"),
    },
    async (params) => {
      const result = await bridge.sendCommand("scroll_into_view", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_section",
    "Create a section on the Figma canvas to organize frames by flow or feature",
    {
      name: z.string().describe("Section name"),
      x: z.number().optional().describe("X position"),
      y: z.number().optional().describe("Y position"),
      width: z.number().optional().describe("Section width"),
      height: z.number().optional().describe("Section height"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_section", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "save_version",
    "Save a named checkpoint in Figma's version history before making large changes via MCP.",
    {
      title: z.string().describe("Version title (e.g. 'Before MCP redesign')"),
      description: z.string().optional().describe("Optional description of what was done"),
    },
    async (params) => {
      const result = await bridge.sendCommand("save_version", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );
}
