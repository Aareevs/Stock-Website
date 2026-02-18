import { WebSocketServer } from 'ws';

const PORT = 4000;
const wss = new WebSocketServer({ port: PORT });

console.log(`🔌 WebSocket sync server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log(`✅ Client connected (total: ${wss.clients.size})`);

  ws.on('message', (raw) => {
    const msg = raw.toString();
    // Broadcast to ALL other connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    });
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected (total: ${wss.clients.size})`);
  });
});
