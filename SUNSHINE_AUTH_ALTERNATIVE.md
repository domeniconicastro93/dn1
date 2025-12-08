# SUNSHINE AUTHENTICATION - ALTERNATIVE APPROACH
## Using Basic Auth Instead of Pairing Protocol

**Date**: 2025-12-05
**Status**: ✅ ACTIVE APPROACH

---

## 🎯 PROBLEM

Sunshine returns **401 Unauthorized** when attempting the standard Moonlight pairing protocol (`/api/pin`, `/api/pair`).

This suggests that:
1. Sunshine requires authentication even for pairing endpoints
2. The pairing protocol might be disabled
3. Sunshine might use a different authentication mechanism

---

## ✅ SOLUTION: USE BASIC AUTH

Instead of the pairing protocol, we'll use **Basic Authentication** which we've already verified works:

```
Authorization: Basic <base64(username:password)>
```

This approach:
- ✅ Already tested and working
- ✅ No PIN required
- ✅ Simpler implementation
- ✅ Compatible with current Sunshine configuration

---

## 🔧 IMPLEMENTATION

### Current Working Authentication

```typescript
const credentials = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json'
};
```

### Launch Steam Game

```typescript
POST https://20.31.130.73:47985/api/launch
Headers:
  Authorization: Basic c3RyaWtlOk5vc21va2luZzkzISE=
  Content-Type: application/json
Body:
  {
    "app": "steam://rungameid/1515950"
  }
```

---

## 📊 NEXT STEPS

1. **Skip pairing protocol** - Use Basic Auth directly
2. **Update launch client** - Use Basic Auth instead of session key
3. **Test game launch** - Try launching via `/api/launch`

---

## 🔄 FALLBACK STRATEGY

If `/api/launch` also requires special authentication:
1. Check Sunshine documentation for correct endpoints
2. Try alternative endpoints (`/api/apps`, `/api/start`, etc.)
3. Consider using Sunshine's web UI automation as last resort

---

**RECOMMENDATION**: Proceed with Basic Auth approach for immediate testing.
