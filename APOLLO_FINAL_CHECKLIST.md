# 🎯 APOLLO + WEBRTC - CHECKLIST FINALE

**Data**: 09 Dicembre 2025, 20:14  
**Obiettivo**: Completare integrazione Apollo + WebRTC end-to-end

---

## ✅ COMPLETATO

### **VM Setup:**
- ✅ Apollo 0.4.6 installato
- ✅ Virtual Display attivo (SudoVDA)
- ✅ Capcom Arcade Stadium configurato in Apollo
- ✅ Firewall Windows configurato (47990, 47998-48010)
- ✅ Credenziali: apollostrike / Nosmoking93!!

### **Backend:**
- ✅ Signaling server Socket.IO implementato
- ✅ VM Provider configurato (20.31.130.73)
- ✅ Session Manager funzionante
- ✅ Build TypeScript successful

### **Frontend:**
- ✅ ApolloWebRTCPlayer component creato
- ✅ Socket.IO client integrato
- ✅ Overlay Strike completo
- ✅ PlayPage integrato

---

## ❌ DA COMPLETARE

### **1. FIX WEBSOCKET SOCKET.IO** 🔴 CRITICO
**Problema**: WebSocket connection failed: Invalid frame header
**Causa**: Conflitto tra Socket.IO e Fastify/VNC proxy
**Soluzione**: Rimuovere VNC proxy o separare path

### **2. IMPLEMENTA GAME LAUNCH API** 🔴 CRITICO
**Problema**: Quando clicchi "Play Now", Apollo non lancia il gioco
**Causa**: Manca chiamata API ad Apollo per lanciare app
**Soluzione**: Implementare chiamata POST a Apollo API

### **3. CONFIGURA AZURE NSG** 🟡 IMPORTANTE
**Problema**: Porte Apollo non accessibili da internet
**Causa**: Regola NSG non configurata
**Soluzione**: Aggiungere regola AllowApollo (47990, 47998-48010)

### **4. TEST STREAMING END-TO-END** 🟢 FINALE
**Problema**: Non testato ancora
**Soluzione**: Test completo dopo fix 1, 2, 3

---

## 🔧 PIANO DI IMPLEMENTAZIONE

### **FASE 1: FIX WEBSOCKET (30 min)**

**Problema**: Socket.IO e VNC proxy competono per WebSocket upgrade

**Soluzione A**: Disabilita VNC proxy (non serve più)
```typescript
// services/orchestrator-service/src/index.ts
// Commenta:
// await vncProxyRoutes(app);
```

**Soluzione B**: Usa path diverso per Socket.IO
```typescript
// Cambia path da '/socket.io/' a '/webrtc-signaling/'
```

**Azione**: Provo Soluzione A (più semplice)

---

### **FASE 2: IMPLEMENTA GAME LAUNCH (1 ora)**

**Flow richiesto:**
```
1. User clicca "Play Now"
2. Frontend → Orchestrator: POST /api/sessions/start
3. Orchestrator → Apollo: POST https://20.31.130.73:47990/api/apps/launch
4. Apollo lancia Capcom Arcade Stadium
5. Orchestrator → Frontend: session details
6. Frontend connette WebRTC
7. STREAMING!
```

**Implementazione:**

#### **2.1: Apollo API Client**
```typescript
// services/orchestrator-service/src/apollo/apollo-client.ts
export class ApolloClient {
    async launchApp(appName: string): Promise<void>
}
```

#### **2.2: Integra in Session Manager**
```typescript
// Dopo allocazione VM, prima di ritornare response:
await apolloClient.launchApp('CapcomArcadeStadium');
```

#### **2.3: Mapping Game → Apollo App**
```typescript
// Mappa gameId Strike → appName Apollo
const gameToApolloApp = {
    'capcom-arcade-stadium': 'CapcomArcadeStadium',
    'steam': 'Steam'
};
```

---

### **FASE 3: CONFIGURA AZURE NSG (5 min)**

**Manuale - User action required:**
```
Azure Portal → strike-vm → Networking → Add inbound rule
Nome: AllowApollo
Priority: 320
Port: 47990,47998-48010
Protocol: Any
Action: Allow
```

---

### **FASE 4: TEST END-TO-END (15 min)**

**Test procedure:**
1. Riavvia Strike
2. Apri http://localhost:3005
3. Click "Play Now" su Capcom Arcade Stadium
4. Verifica log:
   - Session created
   - VM allocated
   - Apollo app launched
   - WebRTC connected
5. Verifica frontend:
   - Video stream visibile
   - Input funzionante
   - Overlay Strike attivo

---

## 🎯 TIMELINE

- **20:15 - 20:45**: FASE 1 - Fix WebSocket
- **20:45 - 21:45**: FASE 2 - Game Launch API
- **21:45 - 21:50**: FASE 3 - Azure NSG
- **21:50 - 22:05**: FASE 4 - Test finale
- **22:05**: 🎉 **MVP COMPLETATO!**

---

## 🆘 FALLBACK PLAN

Se qualcosa non funziona:
1. Documenta stato attuale
2. Crea issue list
3. Riprendi domani fresh

---

## ✅ SUCCESS CRITERIA

MVP è completato quando:
- ✅ Click "Play Now" lancia il gioco su Apollo
- ✅ Video stream visibile nel browser
- ✅ Overlay Strike funzionante
- ✅ Nessun errore critico

---

**INIZIAMO CON FASE 1!** 🚀

**Creato da**: Antigravity Locale  
**Data**: 09 Dicembre 2025, 20:14
