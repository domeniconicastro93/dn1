# Moonlight Wrapper Service

HTTP REST wrapper for Moonlight Protocol to communicate with Apollo/Sunshine streaming server.

## 🎯 Purpose

This service acts as a bridge between Strike's Orchestrator Service (HTTP REST) and Apollo's Moonlight Protocol (TCP binary).

## 🏗️ Architecture

```
Orchestrator Service
    ↓ HTTP REST
Moonlight Wrapper Service ← THIS SERVICE
    ↓ Moonlight Protocol (TCP)
Apollo (VM)
```

## 📋 API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "moonlight-wrapper",
  "moonlight": {
    "connected": false
  }
}
```

### `POST /api/connect`
Connect to Apollo server.

**Request:**
```json
{
  "host": "20.31.130.73",
  "port": 47989
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected to Apollo"
}
```

### `GET /api/apps`
List available applications.

**Response:**
```json
{
  "success": true,
  "apps": [
    { "id": "1", "name": "Desktop" },
    { "id": "2", "name": "Steam Big Picture" },
    { "id": "3", "name": "Capcom Arcade Stadium" }
  ]
}
```

### `POST /api/launch`
Launch an application.

**Request:**
```json
{
  "appName": "Capcom Arcade Stadium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Launched Capcom Arcade Stadium"
}
```

### `GET /api/webrtc/offer`
Get WebRTC stream offer.

**Response:**
```json
{
  "success": true,
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build
pnpm run build

# Start production
pnpm start
```

## ⚙️ Configuration

Edit `.env`:

```env
PORT=3013
HOST=0.0.0.0
APOLLO_HOST=20.31.130.73
APOLLO_PORT=47989
```

## 📝 TODO

- [ ] Implement actual Moonlight protocol handshake
- [ ] Implement app listing via Moonlight
- [ ] Implement app launch via Moonlight
- [ ] Implement WebRTC offer/answer exchange
- [ ] Add authentication/authorization
- [ ] Add error handling and retries
- [ ] Add logging and monitoring

## 🔗 Resources

- [Moonlight Protocol Documentation](https://github.com/moonlight-stream/moonlight-docs)
- [Sunshine Server](https://github.com/LizardByte/Sunshine)
- [Apollo Streaming](https://github.com/games-on-whales/wolf)
