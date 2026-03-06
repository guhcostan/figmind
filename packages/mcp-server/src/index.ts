#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Bridge } from "./bridge.js";
import { createMcpServer } from "./mcp.js";

const bridge = new Bridge(4545);
const server = createMcpServer(bridge);
const transport = new StdioServerTransport();

console.error("[MCP Server] Starting, connecting MCP transport...");
await server.connect(transport);
console.error("[MCP Server] MCP transport connected, waiting for Figma plugin...");
