import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Bridge } from "./bridge.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { registerCanvasTools } from "./tools/canvas.js";
import { registerComponentTools } from "./tools/components.js";
import { registerDesignTools } from "./tools/design.js";
import { registerExportTools } from "./tools/export.js";
import { registerHtmlTools } from "./tools/html.js";
import { registerLibraryTools } from "./tools/library.js";
import { registerNodeTools } from "./tools/nodes.js";
import { registerPrototypeTools } from "./tools/prototype.js";
import { registerVariableTools } from "./tools/variables.js";

export function createMcpServer(bridge: Bridge): McpServer {
  const server = new McpServer({
    name: "figmind",
    version: "1.0.0",
  });

  registerCanvasTools(server, bridge);
  registerVariableTools(server, bridge);
  registerNodeTools(server, bridge);
  registerComponentTools(server, bridge);
  registerPrototypeTools(server, bridge);
  registerHtmlTools(server, bridge);
  registerDesignTools(server, bridge);
  registerExportTools(server, bridge);
  registerLibraryTools(server);
  registerResources(server, bridge);
  registerPrompts(server);

  return server;
}
