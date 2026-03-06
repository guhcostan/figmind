import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const FIGMA_API = "https://api.figma.com/v1";

function getFigmaToken(): string {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error("FIGMA_TOKEN environment variable is not set");
  return token;
}

async function figmaGet(path: string): Promise<unknown> {
  const response = await fetch(`${FIGMA_API}${path}`, {
    headers: { "X-Figma-Token": getFigmaToken() },
  });
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function registerLibraryTools(server: McpServer, _bridge?: unknown): void {
  server.tool(
    "find_components",
    "Search for components by name in any Figma file. Returns key, name, and description — use the key with create_component_instance.",
    {
      fileKey: z.string().describe("Figma file key (from the URL: /design/{fileKey}/...)"),
      nameContains: z
        .string()
        .optional()
        .describe("Filter components whose name contains this string (case-insensitive)"),
    },
    async (params) => {
      const data = (await figmaGet(`/files/${params.fileKey}/components`)) as {
        meta: {
          components: Array<{ key: string; name: string; description: string }>;
        };
      };

      let components = data.meta.components;

      if (params.nameContains) {
        const filter = (params.nameContains as string).toLowerCase();
        components = components.filter((c) => c.name.toLowerCase().includes(filter));
      }

      const result = components.map((c) => ({
        key: c.key,
        name: c.name,
        description: c.description,
      }));

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "find_component_sets",
    "Search for component sets (variant groups) by name in any Figma file. Use the key with find_components to explore individual variants.",
    {
      fileKey: z.string().describe("Figma file key"),
      nameContains: z.string().optional().describe("Filter by name (case-insensitive)"),
    },
    async (params) => {
      const data = (await figmaGet(`/files/${params.fileKey}/component_sets`)) as {
        meta: { component_sets: Array<{ key: string; name: string; description: string }> };
      };
      let sets = data.meta.component_sets;
      if (params.nameContains) {
        const filter = (params.nameContains as string).toLowerCase();
        sets = sets.filter((s) => s.name.toLowerCase().includes(filter));
      }
      const result = sets.map((s) => ({ key: s.key, name: s.name, description: s.description }));
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_file_info",
    "Get metadata for any Figma file by its key: name, last modified date, and list of pages. Useful for inspecting a file from a shared URL without opening it in Figma.",
    {
      fileKey: z.string().describe("Figma file key (from the URL: /design/{fileKey}/...)"),
    },
    async (params) => {
      const data = (await figmaGet(`/files/${params.fileKey}?depth=1`)) as {
        name: string;
        lastModified: string;
        version: string;
        document: { children: Array<{ id: string; name: string; type: string }> };
      };
      const result = {
        name: data.name,
        lastModified: data.lastModified,
        version: data.version,
        pages: data.document.children.map((p) => ({ id: p.id, name: p.name })),
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_file_nodes",
    "Read specific nodes from any Figma file by fileKey and nodeIds. Returns design properties: fills, fonts, layout, children. Useful for inspecting designs from a shared Figma URL.",
    {
      fileKey: z.string().describe("Figma file key (from the URL: /design/{fileKey}/...)"),
      nodeIds: z.array(z.string()).describe("Node IDs to fetch (use colon format: '1:2', '3:4')"),
    },
    async (params) => {
      const ids = (params.nodeIds as string[]).join(",");
      const data = await figmaGet(`/files/${params.fileKey}/nodes?ids=${ids}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "get_file_variables",
    "Get all design tokens (variables) from any Figma file by its key. Returns variable collections, modes, and values — useful for inspecting a remote design system.",
    {
      fileKey: z.string().describe("Figma file key (from the URL: /design/{fileKey}/...)"),
    },
    async (params) => {
      const data = await figmaGet(`/files/${params.fileKey}/variables/local`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
    }
  );

}
