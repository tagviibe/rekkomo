# Socket.io Setup Guide

## Understanding "Transport unknown" Message

The message `{"code":0,"message":"Transport unknown"}` is **NORMAL** and expected behavior. It appears when:

1. **Socket.io handshake**: Socket.io first tries to establish a connection using HTTP polling
2. **Transport negotiation**: The server responds with this message during the initial handshake
3. **Upgrade to WebSocket**: After the handshake, Socket.io upgrades to WebSocket if available

## ✅ How to Verify Socket.io is Working

### 1. Check Server Logs
When a client connects, you should see:
```
✅ Socket.io client connected: [socket-id]
   Transport: polling (then upgrades to websocket)
📥 Socket [socket-id] joined inquiry:[inquiry-id]
```

### 2. Check Browser Console
When the client connects successfully, you should see:
```
✅ Socket.io connected: [socket-id]
   Transport: websocket (or polling)
```

### 3. Test Connection
Open browser DevTools → Network tab → WS (WebSocket) filter
- You should see a WebSocket connection to `/api/socket`
- Status should be "101 Switching Protocols"

## 🔧 Configuration

### Server (`server.js`)
- **Port**: 3000 (same as HTTP server)
- **Path**: `/api/socket`
- **Transports**: websocket, polling (fallback)

### Client (`InquiryChatClient.tsx`)
- **URL**: Auto-detected from `window.location.origin`
- **Path**: `/api/socket`
- **Transports**: websocket (preferred), polling (fallback)

## 🐛 Troubleshooting

### Issue: Repeated "Transport unknown" messages
**Cause**: Socket.io is stuck in polling mode or connection keeps failing

**Solutions**:
1. Check server logs for connection errors
2. Verify CORS settings match your frontend URL
3. Check firewall/proxy settings
4. Ensure server is running: `lsof -ti:3000`

### Issue: No WebSocket upgrade
**Cause**: WebSocket connection blocked or not supported

**Solutions**:
1. Socket.io will automatically fall back to polling (this is fine)
2. Check browser console for errors
3. Verify network tab shows WebSocket connection

### Issue: Connection keeps disconnecting
**Cause**: Network issues or server restart

**Solutions**:
1. Socket.io auto-reconnects (configured with 5 attempts)
2. Check server stability
3. Verify no firewall blocking WebSocket connections

## 📊 Connection Status Indicators

The chat interface shows connection status:
- 🟢 **Online**: Socket connected and ready
- 🟡 **Connecting**: Attempting to connect
- 🔴 **Offline**: Connection failed or disconnected

## 🚀 Quick Test

1. Start server: `npm run dev`
2. Open chat page: `http://localhost:3000/services/inquiry/[userId]`
3. Open browser console (F12)
4. Look for: `✅ Socket.io connected: [socket-id]`
5. Send a message and verify real-time updates

## 📝 Notes

- Socket.io uses **port 3000** (same as HTTP server)
- No separate port needed for WebSocket
- The `/api/socket` path handles both HTTP polling and WebSocket
- "Transport unknown" during handshake is normal and expected
