import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Bridge } from "../bridge.js";

export function registerComponentTools(server: McpServer, bridge: Bridge): void {
  server.tool(
    "get_component_properties",
    "Get the available properties and variants of a component. Use this before set_instance_properties to know which values are valid.",
    {
      componentKey: z.string().optional().describe("Published component key"),
      nodeId: z.string().optional().describe("Node ID of a COMPONENT, COMPONENT_SET, or INSTANCE"),
    },
    async (params) => {
      const result = await bridge.sendCommand("get_component_properties", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "set_instance_properties",
    "Set component property values on an instance node: swap variants (e.g. type=Primary), toggle booleans (e.g. hasIcon=true), or override text.",
    {
      nodeId: z.string().describe("Instance node ID"),
      properties: z
        .record(z.union([z.string(), z.boolean()]))
        .describe("Property name → value pairs. Use get_component_properties first to discover valid names and values."),
    },
    async (params) => {
      const result = await bridge.sendCommand("set_instance_properties", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "swap_component",
    "Swap an instance's component while preserving existing overrides",
    {
      nodeId: z.string().describe("Instance node ID to swap"),
      componentKey: z.string().describe("Key of the new component to use"),
    },
    async (params) => {
      const result = await bridge.sendCommand("swap_component", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "detach_instance",
    "Detach a component instance, converting it to a plain editable frame. Use when you need to customize beyond what component properties allow.",
    {
      nodeId: z.string().describe("Instance node ID to detach"),
    },
    async (params) => {
      const result = await bridge.sendCommand("detach_instance", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "apply_style",
    "Apply a local style to a node by style ID. Use get_design_system_kit to find available style IDs (returned in colorStyles and textStyles).",
    {
      nodeId: z.string().describe("Target node ID"),
      styleId: z.string().describe("Style ID to apply"),
      styleType: z
        .enum(["FILL", "TEXT", "EFFECT", "GRID"])
        .describe("Type of style being applied"),
    },
    async (params) => {
      const result = await bridge.sendCommand("apply_style", params as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );
}
