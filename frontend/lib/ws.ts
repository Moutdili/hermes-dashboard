/**
 * WebSocket client for real-time chat with Hermes Agent.
 */

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = this.url.replace(/^https?/, proto);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => this.emit('open');
    this.ws.onclose = () => {
      this.emit('close');
      // auto-reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };
    this.ws.onerror = () => this.emit('error');
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.emit('message', data);
      } catch {
        this.emit('message', { type: 'raw', content: e.data });
      }
    };
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  private emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach((fn) => fn(...args));
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}