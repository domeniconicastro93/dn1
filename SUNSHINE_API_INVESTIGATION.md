# SUNSHINE API INVESTIGATION
## Testing Different Endpoints and Formats

**Date**: 2025-12-05 15:32
**Current Status**: 400 Bad Request on `/api/launch`

---

## 🔍 CURRENT ERROR

```json
{
  "status": 400,
  "response": "{\"error\":\"Bad Request\",\"status_code\":400}"
}
```

**Request Sent**:
```json
POST https://20.31.130.73:47985/api/launch
Body: { "app": "steam://rungameid/1515950" }
```

---

## 🎯 NEXT STEPS

### 1. Check Available Apps

First, let's see what apps are configured in Sunshine:

**Endpoint**: `GET https://20.31.130.73:47985/api/apps`

This will show us:
- Available apps
- Their IDs
- Correct launch format

### 2. Try Alternative Launch Formats

Based on Sunshine documentation, try:

**Format A: App Index**
```json
POST /api/launch
{ "index": 0 }
```

**Format B: App ID**
```json
POST /api/launch
{ "id": "steam" }
```

**Format C: Direct Command**
```json
POST /api/launch
{ "cmd": "steam://rungameid/1515950" }
```

**Format D: App Name**
```json
POST /api/launch
{ "name": "Steam" }
```

### 3. Try Alternative Endpoints

**Endpoint A**: `/api/apps/0/launch`
```
POST /api/apps/0/launch
```

**Endpoint B**: `/api/start`
```json
POST /api/start
{ "app": 0 }
```

---

## 📊 IMPLEMENTATION PLAN

I'll create multiple test endpoints to try all these formats automatically.
