# Strike Steam Integration - Postman Test Suite

## Complete API Testing Guide

This document provides a comprehensive Postman test suite for testing the entire Strike Steam integration flow, including authentication, session management, and Steam library access.

---

## Prerequisites

1. **Gateway Service** running on `http://localhost:3000`
2. **Auth Service** running on `http://localhost:3001`
3. **Steam Library Service** running on `http://localhost:3022`
4. **PostgreSQL Database** running and seeded with test users
5. **Postman** or any HTTP client installed

---

## Environment Variables (Postman)

Create a Postman environment with these variables:

```json
{
  "gateway_url": "http://localhost:3000",
  "auth_service_url": "http://localhost:3001",
  "steam_service_url": "http://localhost:3022",
  "access_token": "",
  "refresh_token": "",
  "user_id": ""
}
```

---

## Test Flow Overview

```
1. Register/Login → Get JWT Token
2. Get Session → Verify Token & User Data
3. Link Steam Account → OAuth Flow (Manual)
4. Get Owned Games → Via Gateway (Protected)
5. Test Token in Cookie → Alternative Auth Method
```

---

## 1. User Registration

**Endpoint:** `POST {{gateway_url}}/api/auth/v1/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "testuser@strike.gg",
  "password": "SecurePassword123!",
  "locale": "en",
  "marketingConsent": false
}
```

**Expected Response (201):**
```json
{
  "data": {
    "userId": "uuid-here",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has access token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('accessToken');
    pm.environment.set("access_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
    pm.environment.set("user_id", jsonData.data.userId);
});
```

---

## 2. User Login

**Endpoint:** `POST {{gateway_url}}/api/auth/v1/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "testuser@strike.gg",
  "password": "SecurePassword123!"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "userId": "uuid-here",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has valid tokens", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('accessToken');
    pm.expect(jsonData.data).to.have.property('refreshToken');
    
    // Save tokens to environment
    pm.environment.set("access_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
    pm.environment.set("user_id", jsonData.data.userId);
});

pm.test("Token is valid JWT", function () {
    var token = pm.response.json().data.accessToken;
    var parts = token.split('.');
    pm.expect(parts.length).to.equal(3);
});
```

---

## 3. Get Session (Verify Token)

**Endpoint:** `GET {{gateway_url}}/api/auth/v1/session`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Expected Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@strike.gg",
      "displayName": null,
      "avatarUrl": null,
      "steamId64": null
    }
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("User data is returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('user');
    pm.expect(jsonData.data.user).to.have.property('email');
    pm.expect(jsonData.data.user.id).to.equal(pm.environment.get("user_id"));
});
```

---

## 4. Refresh Token

**Endpoint:** `POST {{gateway_url}}/api/auth/v1/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("New tokens are returned", function () {
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
});
```

---

## 5. Steam OAuth Flow (Manual Browser Test)

### Step 5.1: Initiate Steam Login

**Endpoint:** `GET {{gateway_url}}/api/steam/v1/auth`

**Method:** Open in Browser (requires manual interaction)

**Expected Behavior:**
1. Redirects to Steam OpenID login page
2. User logs into Steam
3. Steam redirects back to `/api/steam/v1/callback`
4. User is redirected to frontend with `?steam=linked`

**Important:** Before initiating this flow, ensure you have a valid `strike_access_token` cookie set in your browser by logging in to the web app first.

### Step 5.2: Verify Steam Link in Session

After completing the Steam OAuth flow, verify the Steam ID was linked:

**Endpoint:** `GET {{gateway_url}}/api/auth/v1/session`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Expected Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@strike.gg",
      "displayName": null,
      "avatarUrl": null,
      "steamId64": "76561198XXXXXXXXX"
    }
  }
}
```

---

## 6. Get Owned Games (Via Gateway with Bearer Token)

**Endpoint:** `GET {{gateway_url}}/api/steam/v1/owned-games`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Expected Response (200):**
```json
{
  "data": {
    "games": [
      {
        "appid": 730,
        "name": "Counter-Strike 2",
        "playtime_forever": 12345,
        "img_icon_url": "...",
        "img_logo_url": "..."
      },
      {
        "appid": 570,
        "name": "Dota 2",
        "playtime_forever": 54321,
        "img_icon_url": "...",
        "img_logo_url": "..."
      }
    ],
    "privacyState": "public"
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Games array is returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('games');
    pm.expect(jsonData.data.games).to.be.an('array');
});

pm.test("Privacy state is returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('privacyState');
    pm.expect(jsonData.data.privacyState).to.be.oneOf(['public', 'private', 'unknown']);
});

pm.test("Games have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.data.games.length > 0) {
        var game = jsonData.data.games[0];
        pm.expect(game).to.have.property('appid');
        pm.expect(game).to.have.property('name');
        pm.expect(game).to.have.property('playtime_forever');
    }
});
```

---

## 7. Get Owned Games (Direct to Steam Service)

**Endpoint:** `GET {{steam_service_url}}/api/steam/owned-games`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Expected Response (200):**
Same as above - validates the service works independently.

---

## 8. Test Unauthorized Access (No Token)

**Endpoint:** `GET {{gateway_url}}/api/steam/v1/owned-games`

**Headers:**
```
(No Authorization header)
```

**Expected Response (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Postman Tests Script:**
```javascript
pm.test("Status code is 401", function () {
    pm.response.to.have.status(401);
});

pm.test("Error code is UNAUTHORIZED", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.error.code).to.equal("UNAUTHORIZED");
});
```

---

## 9. Test Invalid Token

**Endpoint:** `GET {{gateway_url}}/api/steam/v1/owned-games`

**Headers:**
```
Authorization: Bearer invalid_token_here
```

**Expected Response (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

---

## 10. Test Cookie-Based Authentication

### Step 10.1: Login and Get Token

Use Test #2 (Login) to get a valid token.

### Step 10.2: Make Request with Cookie Instead of Header

**Endpoint:** `GET {{gateway_url}}/api/steam/v1/owned-games`

**Headers:**
```
Cookie: strike_access_token={{access_token}}
```

**Expected Response (200):**
Same as Test #6 - proves cookie authentication works.

---

## 11. Logout

**Endpoint:** `POST {{gateway_url}}/api/auth/v1/logout`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

**Expected Response (200):**
```json
{
  "data": {
    "success": true
  }
}
```

---

## 12. Health Checks

### Gateway Health
**Endpoint:** `GET {{gateway_url}}/health`
**Expected:** `{ "data": { "status": "ok", "service": "gateway-service" } }`

### Auth Service Health
**Endpoint:** `GET {{auth_service_url}}/health`
**Expected:** `{ "data": { "status": "ok", "service": "auth-service" } }`

### Steam Service Health
**Endpoint:** `GET {{steam_service_url}}/health`
**Expected:** Response depends on implementation

---

## Common Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 401 | TOKEN_EXPIRED | Token has expired |
| 404 | NOT_FOUND | Endpoint not found |
| 409 | EMAIL_ALREADY_EXISTS | Email already registered |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Upstream service down |

---

## Debugging Tips

### Enable Debug Logging

Set these environment variables on the services:

```bash
# Enable JWT debugging
DEBUG_JWT=true

# Enable Steam API debugging
STEAM_DEBUG_LOG=true

# Enable general debugging
DEBUG_STEAM=true
```

### Check Logs

```bash
# Gateway logs
# Watch for JWT validation messages and proxy routing

# Auth Service logs
# Watch for login/registration events

# Steam Library Service logs
# Watch for Steam API calls with full request/response details
```

### Decode JWT Token

Use https://jwt.io to decode and inspect JWT tokens.

**Example Payload:**
```json
{
  "userId": "uuid-here",
  "email": "user@strike.gg",
  "steamId64": "76561198XXXXXXXXX",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Postman Collection Import

You can import this as a Postman collection by converting the above to JSON format. Here's a starter template:

```json
{
  "info": {
    "name": "Strike Steam Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Register User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"testuser@strike.gg\",\n  \"password\": \"SecurePassword123!\",\n  \"locale\": \"en\",\n  \"marketingConsent\": false\n}"
        },
        "url": {
          "raw": "{{gateway_url}}/api/auth/v1/register",
          "host": ["{{gateway_url}}"],
          "path": ["api", "auth", "v1", "register"]
        }
      }
    },
    {
      "name": "2. Login User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"testuser@strike.gg\",\n  \"password\": \"SecurePassword123!\"\n}"
        },
        "url": {
          "raw": "{{gateway_url}}/api/auth/v1/login",
          "host": ["{{gateway_url}}"],
          "path": ["api", "auth", "v1", "login"]
        }
      }
    },
    {
      "name": "3. Get Session",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{gateway_url}}/api/auth/v1/session",
          "host": ["{{gateway_url}}"],
          "path": ["api", "auth", "v1", "session"]
        }
      }
    },
    {
      "name": "6. Get Owned Games",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{gateway_url}}/api/steam/v1/owned-games",
          "host": ["{{gateway_url}}"],
          "path": ["api", "steam", "v1", "owned-games"]
        }
      }
    }
  ]
}
```

---

## Success Criteria

✅ All tests pass with expected status codes
✅ JWT tokens are generated and validated correctly
✅ Session endpoint returns user data with Steam ID (after linking)
✅ Steam OAuth flow successfully links account
✅ Owned games endpoint returns full game list (not truncated)
✅ Both Bearer token and cookie authentication work
✅ Unauthorized requests return 401
✅ Error messages are clear and actionable

---

## Next Steps

After validating all endpoints with Postman:
1. Test the web frontend integration
2. Verify Steam library displays correctly
3. Test token refresh flow
4. Test CSRF protection in Steam callback
5. Load test with concurrent requests

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Maintained By:** Strike Engineering Team

