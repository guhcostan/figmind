import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerVariableTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "apply_variable_to_node",
    "Bind a variable to a node property",
    {
      nodeId: z.string().describe("Target node ID"),
      property: z.string().describe("Property to bind (fills, strokes, opacity, width, height)"),
      variableId: z.string().describe("Variable ID to bind"),
    },
    async (params) => {
      const result = await bridge.sendCommand(
        "apply_variable_to_node",
        params as Record<string, unknown>
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_variable_collection",
    "Create a new variable collection (design token group) in the current Figma file",
    {
      name: z.string().describe("Collection name (e.g. 'Brand Colors', 'Spacing')"),
      initialModeName: z.string().optional().describe("Rename the default mode (default: 'Mode 1')"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_variable_collection", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "create_variable",
    "Create a new variable (design token) inside a collection",
    {
      collectionId: z.string().describe("Target collection ID"),
      name: z.string().describe("Variable name (e.g. 'color/primary', 'spacing/md')"),
      resolvedType: z.enum(["COLOR", "FLOAT", "STRING", "BOOLEAN"]).describe("Variable type"),
      value: z.unknown().optional().describe("Initial value for the default mode. COLOR: {r,g,b,a} (0-1). FLOAT: number. STRING: string. BOOLEAN: boolean."),
      valuesByMode: z.record(z.unknown()).optional().describe("Values per mode ID: { 'modeId': value }. Overrides value if provided."),
      description: z.string().optional().describe("Token description / usage note"),
      scopes: z.array(z.string()).optional().describe("Scopes where this token applies (e.g. ['FILL', 'STROKE', 'GAP'])"),
      codeSyntax: z.object({
        WEB: z.string().optional(),
        ANDROID: z.string().optional(),
        iOS: z.string().optional(),
      }).optional().describe("Platform-specific code names (e.g. { WEB: '--color-primary' })"),
    },
    async (params) => {
      const result = await bridge.sendCommand("create_variable", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "update_variable",
    "Update an existing variable: rename, change value for a mode, update description or scopes",
    {
      variableId: z.string().describe("Variable ID to update"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      scopes: z.array(z.string()).optional().describe("New scopes"),
      modeId: z.string().optional().describe("Mode ID to update value for"),
      value: z.unknown().optional().describe("New value for the specified modeId"),
      valuesByMode: z.record(z.unknown()).optional().describe("Update multiple modes at once: { modeId: value }"),
    },
    async (params) => {
      const result = await bridge.sendCommand("update_variable", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "delete_variable",
    "Delete a variable (design token) by ID",
    {
      variableId: z.string().describe("Variable ID to delete"),
    },
    async (params) => {
      const result = await bridge.sendCommand("delete_variable", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "delete_variable_collection",
    "Delete a variable collection and all its variables",
    {
      collectionId: z.string().describe("Collection ID to delete"),
    },
    async (params) => {
      const result = await bridge.sendCommand("delete_variable_collection", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "add_variable_mode",
    "Add a new mode to a variable collection (e.g. add 'Dark' to a Light/Dark theme collection)",
    {
      collectionId: z.string().describe("Collection ID"),
      name: z.string().describe("New mode name (e.g. 'Dark', 'Mobile', 'High Contrast')"),
    },
    async (params) => {
      const result = await bridge.sendCommand("add_variable_mode", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "rename_variable_mode",
    "Rename an existing mode in a variable collection",
    {
      collectionId: z.string().describe("Collection ID"),
      modeId: z.string().describe("Mode ID to rename"),
      name: z.string().describe("New mode name"),
    },
    async (params) => {
      const result = await bridge.sendCommand("rename_variable_mode", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );
}
