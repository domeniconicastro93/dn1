# 🔥 AZURE NSG CONFIGURATION FOR APOLLO

## Istruzioni per configurare Azure Network Security Group

### Vai su Azure Portal

1. Apri: https://portal.azure.com
2. Cerca la tua VM: **Strike_VM_1** (o il nome della tua VM)
3. Vai su: **Networking** → **Network Security Group**

### Aggiungi Regola Inbound

Clicca su **"Add inbound port rule"** e configura:

```
Nome:              AllowApollo
Priorità:          320
Porta sorgente:    *
Porta destinazione: 47990,47998-48010
Protocollo:        Any
Azione:            Allow
Descrizione:       Apollo WebRTC Streaming
```

### Verifica Regola

Dopo aver salvato, dovresti vedere la regola "AllowApollo" nella lista.

### Test Connessione

Dalla tua macchina locale, testa:

```bash
# Test porta HTTPS Apollo
curl -k https://<IP_PUBBLICO_VM>:47990

# Dovrebbe rispondere con la pagina Apollo
```

---

## 🎮 DOPO LA CONFIGURAZIONE NSG

Quando hai configurato l'NSG, torna da Antigravity locale e:

1. Aggiorna l'Orchestrator Service per connettersi ad Apollo
2. Implementa il signaling server WebRTC
3. Integra il client WebRTC nel frontend Strike
4. **TESTA LO STREAMING!**

---

**Creato**: 09 Dicembre 2025, 16:38
**Status**: PRONTO PER NSG CONFIGURATION
