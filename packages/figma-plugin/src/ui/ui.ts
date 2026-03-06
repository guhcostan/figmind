const WS_URL = "ws://localhost:4545";
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;

interface InboundCommand {
  requestId: string;
  command: string;
  params: Record<string, unknown>;
}

interface OutboundResponse {
  requestId: string;
  result?: unknown;
  error?: string;
}

let ws: WebSocket | null = null;
let reconnectDelayMs = RECONNECT_BASE_DELAY_MS;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect(): void {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    reconnectDelayMs = RECONNECT_BASE_DELAY_MS;
    setStatus(true);
  };

  ws.onmessage = (event: MessageEvent) => {
    let message: InboundCommand;
    try {
      message = JSON.parse(event.data as string) as InboundCommand;
    } catch {
      return;
    }
    parent.postMessage({ pluginMessage: message }, "*");
  };

  ws.onclose = () => {
    ws = null;
    setStatus(false);
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, RECONNECT_MAX_DELAY_MS);
    connect();
  }, reconnectDelayMs);
}

function setStatus(connected: boolean): void {
  const indicator = document.getElementById("indicator");
  const statusText = document.getElementById("status-text");
  if (indicator) {
    indicator.className = connected ? "indicator connected" : "indicator";
  }
  if (statusText) {
    statusText.textContent = connected ? "Connected" : "Disconnected";
  }
}

window.onmessage = (event: MessageEvent) => {
  const response = event.data?.pluginMessage as OutboundResponse | undefined;
  if (!response?.requestId) return;
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(response));
  }
};

connect();
