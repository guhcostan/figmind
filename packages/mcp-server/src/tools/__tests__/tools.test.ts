import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCanvasTools } from "../canvas.js";
import { registerComponentTools } from "../components.js";
import { registerDesignTools } from "../design.js";
import { registerExportTools } from "../export.js";
import { registerLibraryTools } from "../library.js";
import { registerNodeTools } from "../nodes.js";
import { registerPrototypeTools } from "../prototype.js";
import { registerVariableTools } from "../variables.js";

function makeMockBridge() {
  return { sendCommand: vi.fn().mockResolvedValue({ success: true }) };
}

function spyOnToolRegistration(server: McpServer): string[] {
  const tools: string[] = [];
  const spy = vi.spyOn(server, "tool");
  spy.mockImplementation((...args: Parameters<typeof server.tool>) => {
    tools.push(args[0] as string);
    return undefined as never;
  });
  return tools;
}

describe("Tool registration", () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: "test", version: "0.0.1" });
  });

  it("registers all canvas tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerCanvasTools(server, bridge as never);
    expect(tools).toContain("create_frame");
    expect(tools).toContain("create_text");
    expect(tools).toContain("create_component_instance");
    expect(tools).toContain("duplicate_node");
    expect(tools).toContain("set_image_fill");
    expect(tools).toContain("bulk_update");
    expect(tools).toContain("create_shape");
    expect(tools).toContain("create_from_svg");
    expect(tools).toContain("set_effects");
    expect(tools).toContain("set_fill");
    expect(tools).toContain("set_text_properties");
    expect(tools).toContain("update_auto_layout");
    expect(tools).not.toContain("set_node_property");
    expect(tools).not.toContain("set_constraints");
    expect(tools).not.toContain("group_nodes");
    expect(tools).not.toContain("ungroup_nodes");
    expect(tools).not.toContain("boolean_operation");
  });

  it("registers all component tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerComponentTools(server, bridge as never);
    expect(tools).toContain("get_component_properties");
    expect(tools).toContain("set_instance_properties");
    expect(tools).toContain("swap_component");
    expect(tools).toContain("detach_instance");
    expect(tools).toContain("apply_style");
    expect(tools).not.toContain("get_local_styles");
  });

  it("registers all node tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerNodeTools(server, bridge as never);
    expect(tools).toContain("get_selection");
    expect(tools).toContain("get_node");
    expect(tools).toContain("get_full_tree");
    expect(tools).toContain("find_nodes");
    expect(tools).toContain("delete_nodes");
    expect(tools).toContain("move_node");
    expect(tools).toContain("get_used_fonts");
    expect(tools).not.toContain("get_children");
    expect(tools).not.toContain("delete_node");
    expect(tools).not.toContain("get_available_fonts");
  });

  it("registers all prototype tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerPrototypeTools(server, bridge as never);
    expect(tools).toContain("set_reactions");
    expect(tools).toContain("get_pages");
    expect(tools).toContain("create_page");
    expect(tools).toContain("set_current_page");
    expect(tools).toContain("scroll_into_view");
    expect(tools).toContain("create_section");
    expect(tools).toContain("save_version");
  });

  it("registers all library tools", () => {
    const tools = spyOnToolRegistration(server);
    registerLibraryTools(server);
    expect(tools).toContain("find_components");
    expect(tools).toContain("find_component_sets");
    expect(tools).toContain("get_file_info");
    expect(tools).toContain("get_file_nodes");
    expect(tools).toContain("get_file_variables");
  });

  it("registers all export tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerExportTools(server, bridge as never);
    expect(tools).toContain("export_node");
    expect(tools).toContain("export_batch");
  });

  it("registers all variable tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerVariableTools(server, bridge as never);
    expect(tools).toContain("apply_variable_to_node");
    expect(tools).toContain("create_variable_collection");
    expect(tools).toContain("create_variable");
    expect(tools).toContain("update_variable");
    expect(tools).toContain("delete_variable");
    expect(tools).toContain("delete_variable_collection");
    expect(tools).toContain("add_variable_mode");
    expect(tools).toContain("rename_variable_mode");
    expect(tools).not.toContain("get_variable_collections");
    expect(tools).not.toContain("get_variables");
  });

  it("registers all design tools", () => {
    const bridge = makeMockBridge();
    const tools = spyOnToolRegistration(server);
    registerDesignTools(server, bridge as never);
    expect(tools).toContain("get_design_system_kit");
    expect(tools).toContain("execute");
  });
});
