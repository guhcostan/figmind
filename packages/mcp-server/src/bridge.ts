import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: NodeJS.Timeout;
}

interface PluginResponse {
  requestId: string;
  result?: unknown;
  error?: string;
}

export class Bridge {
  private wss: WebSocketServer;
  private connection: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port, host: "127.0.0.1" });

    this.wss.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[MCP Bridge] Port ${port} already in use. Run: lsof -ti :${port} | xargs kill -9`
        );
        process.exit(1);
      }
      throw err;
    });

    this.wss.on("listening", () => {
      console.error(`[MCP Bridge] WebSocket server listening on ws://127.0.0.1:${port}`);
    });

    this.wss.on("connection", (ws) => {
      this.connection = ws;
      console.error("[MCP Bridge] Figma plugin connected");

      ws.on("message", (data) => this.handleMessage(data.toString()));

      ws.on("close", () => {
        this.connection = null;
        console.error("[MCP Bridge] Figma plugin disconnected");
        for (const [, request] of this.pending) {
          clearTimeout(request.timer);
          request.reject(new Error("Figma plugin disconnected"));
        }
        this.pending.clear();
      });

      ws.on("error", (err) => {
        console.error("[MCP Bridge] WebSocket error:", err.message);
        ws.close();
      });
    });
  }

  private handleMessage(data: string): void {
    let message: PluginResponse;
    try {
      message = JSON.parse(data) as PluginResponse;
    } catch {
      return;
    }

    const pending = this.pending.get(message.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(message.requestId);

    if (message.error) {
      pending.reject(new Error(message.error));
    } else {
      pending.resolve(message.result);
    }
  }

  async sendCommand(command: string, params: Record<string, unknown>, timeoutMs?: number): Promise<unknown> {
    if (!this.connection) {
      throw new Error("Figma plugin not connected");
    }

    const requestId = randomUUID();
    const resolvedTimeout = timeoutMs ?? Bridge.defaultTimeoutFor(command);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Request timed out: ${command}`));
      }, resolvedTimeout);

      this.pending.set(requestId, { resolve, reject, timer });
      this.connection!.send(JSON.stringify({ requestId, command, params }));
    });
  }

  private static defaultTimeoutFor(command: string): number {
    const heavy = new Set(["create_tree", "set_image_fill", "get_full_tree", "find_nodes", "get_design_system_kit", "execute", "export_node", "export_batch", "export_page", "get_file_context", "get_page_components", "get_all_used_styles"]);
    const medium = new Set(["create_component_instance", "swap_component", "get_available_fonts", "get_library_variables"]);
    if (heavy.has(command)) return 120_000;
    if (medium.has(command)) return 30_000;
    return 15_000;
  }
}
