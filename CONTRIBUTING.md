# Contributing to figmind

Contributions are welcome and appreciated!

## Getting Started

```bash
git clone https://github.com/guhcostan/figmind.git
cd figmind
yarn install
```

Start both packages in watch mode:

```bash
yarn dev
```

## Project Structure

```
packages/
├── mcp-server/   # MCP server — publishes to npm as figmind
└── figma-plugin/ # Figma plugin — bridges WebSocket to canvas
```

## Adding a New Tool

Every tool has three parts:

**1. Tool implementation** — `packages/mcp-server/src/tools/<category>.ts`

```typescript
export function registerMyTools(server: McpServer, bridge: Bridge): void {
  server.tool("my_tool", "Description of what it does", {
    nodeId: z.string().describe("The node ID"),
  }, async ({ nodeId }) => {
    const result = await bridge.sendCommand("my_tool", { nodeId });
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  });
}
```

**2. Register in server** — `packages/mcp-server/src/mcp.ts`

```typescript
import { registerMyTools } from "./tools/my-file.js";
// ...
registerMyTools(server, bridge);
```

**3. Handle in plugin** — `packages/figma-plugin/src/code.ts`

```typescript
case "my_tool": {
  const node = figma.getNodeById(params.nodeId as string);
  return { success: true, data: node };
}
```

## Running Tests

```bash
yarn test
```

Tests live in `packages/mcp-server/src/tools/__tests__/`. Add a test for any new tool.

## Before Submitting

```bash
yarn lint   # if configured
yarn tsc    # TypeScript must compile
yarn test   # all tests must pass
yarn build  # build must succeed
```

## Submitting a PR

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes
4. Open a pull request against `master`

Please keep PRs focused — one feature or fix per PR makes review much easier.
