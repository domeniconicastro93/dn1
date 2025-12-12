# 🔐 APOLLO PAIRING - SOLUZIONE CORRETTA

**Data**: 09 Dicembre 2025, 20:52  
**Da**: Antigravity VM

---

## ❌ PROBLEMA IDENTIFICATO

Apollo/Sunshine **NON supporta pairing via REST API** come pensavamo!

Il 400 Bad Request è normale perché `/api/pair` **non è un endpoint di pairing**, ma un endpoint di configurazione che richiede autenticazione Web UI.

---

## ✅ SOLUZIONI DISPONIBILI

### OPZIONE 1: Pairing via Web UI (CONSIGLIATO per testing)

Il modo più semplice per testare:

1. **Sul PC locale**, apri browser:
   ```
   https://20.31.130.73:47990
   ```

2. **Login**:
   - Username: `strike`
   - Password: `Nosmoking93!!`

3. **Vai su Settings → Clients**

4. **Aggiungi nuovo client**:
   - Nome: "Strike Cloud Gaming"
   - Genera PIN o approva automaticamente

5. **Salva le credenziali** per usarle nello streaming

---

### OPZIONE 2: Usa Moonlight SDK (per produzione)

Per pairing programmatico, devi usare il **Moonlight Protocol** completo.

Apollo implementa il protocollo Moonlight, che usa:
- **HTTPS** per handshake iniziale
- **Certificati X.509** per autenticazione
- **Protocollo binario** per pairing

#### Librerie disponibili:

**Node.js**:
```bash
npm install moonlight-common-c
```

**TypeScript/JavaScript** (alternativa):
Usa `node-moonlight` o implementa il protocollo manualmente.

---

### OPZIONE 3: Bypass Pairing (SOLO per development)

Per testing, puoi disabilitare il pairing requirement:

**Sulla VM, modifica `sunshine.conf`**:

```conf
# Disable pairing requirement
require_pairing = false
```

Poi riavvia Apollo:
```powershell
Restart-Service -Name "ApolloService" -Force
```

⚠️ **ATTENZIONE**: Questo è **INSICURO** e va usato solo per testing locale!

---

## 🎯 RACCOMANDAZIONE PER STRIKE

Per Strike Cloud Gaming, ti consiglio:

### FASE 1: Testing (ORA)
1. Usa **Web UI** per creare il primo pairing manualmente
2. Testa lo streaming WebRTC
3. Verifica che tutto funzioni

### FASE 2: Produzione (DOPO)
1. Implementa protocollo Moonlight completo
2. Oppure usa libreria esistente (`moonlight-common-c`)
3. Gestisci certificati e pairing automatico

---

## 🔧 QUICK FIX: Disabilita Pairing

Vuoi che disabiliti il pairing requirement per testare subito lo streaming?

Se sì, eseguo:
```powershell
# Aggiungi a sunshine.conf
echo "credentials_file = " >> "C:\Program Files\Apollo\config\sunshine.conf"
Restart-Service -Name "ApolloService" -Force
```

Questo permetterà connessioni senza pairing (solo per testing!).

---

## 📚 RIFERIMENTI

- **Moonlight Protocol**: https://github.com/moonlight-stream/moonlight-docs
- **Sunshine (Apollo base)**: https://github.com/LizardByte/Sunshine
- **Moonlight Pairing**: https://github.com/moonlight-stream/moonlight-common-c

---

## 🎮 PROSSIMI STEP

**Scegli un'opzione**:

1. **Quick Test**: Disabilito pairing → testi streaming subito
2. **Web UI**: Fai pairing manuale via browser → testi streaming
3. **Moonlight SDK**: Implementi protocollo completo (più tempo)

**Quale preferisci?** 🚀

---

**Creato**: 09 Dicembre 2025, 20:52  
**Status**: Waiting for decision
