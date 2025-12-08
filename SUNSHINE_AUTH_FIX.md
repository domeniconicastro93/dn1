# SUNSHINE AUTHENTICATION FIX

**Date**: 2025-12-06 14:55
**Status**: 🔧 FIX REQUIRED

---

## 🎯 PROBLEMA

**Errore**: `"Failed to authenticate with Sunshine: Sunshine authentication failed: 400 Bad Request"`

**Causa**: Il metodo `login()` in `sunshine-client.ts` sta cercando di chiamare `/api/login` che probabilmente non esiste o richiede un formato diverso.

---

## 🔍 ANALISI

Dal codice in `sunshine-client.ts` (linee 221-292):

```typescript
// Try to get PIN
const pinResponse = await this.request('/api/pin', {
    method: 'GET',
    headers: { 'Authorization': `Basic ${credentials}` },
});

// Authenticate
const authResponse = await this.request('/api/login', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}` },
    body: JSON.stringify({
        username: this.config.credentials.username,
        password: this.config.credentials.password,
        pin,
    }),
});
```

**Problema**: Sunshine potrebbe non avere questi endpoint o richiedere un formato diverso.

---

## ✅ SOLUZIONE

Sunshine usa **Basic Authentication** per tutte le richieste API. Non serve un "login" separato.

**Fix**: Modificare il metodo `login()` per:
1. Saltare la chiamata a `/api/pin` e `/api/login`
2. Usare solo Basic Auth nelle richieste successive
3. Testare la connessione con `/api/apps` o `/api/config`

---

## 🔧 FIX DA APPLICARE

**File**: `services/orchestrator-service/src/core/sunshine-client.ts`

**Metodo**: `login()` (linee 221-292)

**Cambiamento**:

```typescript
async login(): Promise<SunshineSessionInfo> {
    console.log('[SunshineClient] login() - Authenticating with Sunshine');

    try {
        // Create Basic Auth header
        const credentials = Buffer.from(
            `${this.config.credentials.username}:${this.config.credentials.password}`
        ).toString('base64');

        // Store credentials for future requests
        this.sessionToken = credentials;
        
        // Test authentication by getting apps list
        try {
            const apps = await this.request<SunshineApp[] | { apps: SunshineApp[] }>('/api/apps', {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });

            // Handle different response formats
            let appsList: SunshineApp[];
            if (Array.isArray(apps)) {
                appsList = apps;
            } else if (apps && typeof apps === 'object' && 'apps' in apps) {
                appsList = apps.apps;
            } else {
                appsList = [];
            }

            console.log('[SunshineClient] Authentication successful, found', appsList.length, 'apps');

            this.authenticated = true;

            return {
                authenticated: true,
                token: this.sessionToken,
                version: 'unknown',
                apps: appsList,
            };
        } catch (error) {
            console.error('[SunshineClient] Authentication failed:', error);
            this.authenticated = false;
            throw new Error(`Sunshine authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    } catch (error) {
        console.error('[SunshineClient] Authentication setup failed:', error);
        this.authenticated = false;
        throw new Error(`Sunshine authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
```

**E modificare il metodo `request()` per usare Basic Auth invece di Bearer**:

```typescript
// Add authentication (line 139-142)
if (this.sessionToken) {
    headers['Authorization'] = `Basic ${this.sessionToken}`; // Changed from Bearer to Basic
}
```

---

## 📊 COSA CAMBIERÀ

### Prima:
```
1. GET /api/pin → 400 Bad Request ❌
2. POST /api/login → Mai raggiunto
```

### Dopo:
```
1. GET /api/apps con Basic Auth → 200 OK ✅
2. Autenticazione completata
```

---

## 🚀 PROSSIMI PASSI

1. Applicherò il fix al codice
2. Riavvieremo l'Orchestrator
3. Testeremo "Play Now"

---

**APPLICO IL FIX ORA...**
