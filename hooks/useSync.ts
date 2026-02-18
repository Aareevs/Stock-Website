import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:4000';

export type SyncMessage =
  | { type: 'NEWS_TRIGGERED'; payload: any }
  | { type: 'NEWS_STOPPED'; payload: { eventId: string } }
  | { type: 'MARKET_UPDATE'; payload: any[] }
  | { type: 'SIMULATION_RESET' };

export function useSync(onMessage: (msg: SyncMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('🔌 Sync connected');
          wsRef.current = ws;
        };

        ws.onmessage = (e) => {
          try {
            const msg: SyncMessage = JSON.parse(e.data);
            onMessageRef.current(msg);
          } catch { /* ignore bad messages */ }
        };

        ws.onclose = () => {
          wsRef.current = null;
          // Reconnect after 2 seconds
          reconnectTimer = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimer = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const broadcast = useCallback((msg: SyncMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { broadcast };
}
