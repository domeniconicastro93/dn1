# 🔍 PROBLEMA IDENTIFICATO - Timeout Sunshine Login

**Data**: 08 Dicembre 2025, 20:16  
**Stato**: ❌ **BLOCCATO**

---

## 🎯 PROBLEMA

Quando il frontend chiama `/api/sessions/request`, l'Orchestrator:
1. Chiama `SessionManager.startSession()`
2. Chiama `sunshineClient.login()`
3. **VA IN TIMEOUT** (5 minuti configurati)
4. **L'Orchestrator CRASHA**

---

## 🔍 CAUSA ROOT

Il `SunshineClient.login()` prova a connettersi a Sunshine ma:
- ❌ Potrebbe esserci un problema di connessione
- ❌ Potrebbe essere un problema di autenticazione
- ❌ Il timeout di 5 minuti è troppo lungo

---

## ✅ SOLUZIONE

### Opzione 1: Ridurre Timeout (VELOCE)
Ridurre il timeout da 5 minuti a 10 secondi per fallire velocemente.

### Opzione 2: Skip Login se Non Necessario (MIGLIORE)
Se Sunshine non richiede login per lanciare app (dopo il bypass pairing), possiamo skippare il login.

### Opzione 3: Test Connessione Prima
Testare la connessione prima di provare il login.

---

## 🚀 IMPLEMENTAZIONE OPZIONE 2

Modificare `SessionManager.startSession()` per:
1. ✅ Allocare VM
2. ✅ Creare session ID
3. ❌ **SKIP** login (non necessario dopo bypass pairing)
4. ✅ Restituire risposta con parametri Moonlight
5. ✅ Moonlight si connette direttamente

---

**Procedo con Opzione 2?**
