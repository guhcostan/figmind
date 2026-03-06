import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Bridge } from "./bridge.js";

export function registerResources(server: McpServer, bridge: Bridge): void {
  server.resource(
    "figma-pages",
    "figma://pages",
    { mimeType: "application/json", description: "List of all pages in the current Figma file" },
    async () => {
      const pages = await bridge.sendCommand("get_pages", {});
      return {
        contents: [
          {
            uri: "figma://pages",
            mimeType: "application/json",
            text: JSON.stringify(pages, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    "figma-design-system",
    "figma://design-system",
    {
      mimeType: "application/json",
      description:
        "Full design system context: variables, color styles, text styles, effects, and fonts used in the current Figma file",
    },
    async () => {
      const kit = await bridge.sendCommand("get_design_system_kit", {});
      return {
        contents: [
          {
            uri: "figma://design-system",
            mimeType: "application/json",
            text: JSON.stringify(kit, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    "figma-selection",
    "figma://selection",
    {
      mimeType: "application/json",
      description: "Nodes currently selected by the user in Figma",
    },
    async () => {
      const selection = await bridge.sendCommand("get_selection", {});
      return {
        contents: [
          {
            uri: "figma://selection",
            mimeType: "application/json",
            text: JSON.stringify(selection, null, 2),
          },
        ],
      };
    }
  );
}
