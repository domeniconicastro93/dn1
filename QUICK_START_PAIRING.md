# 🎯 QUICK START - APOLLO PAIRING

## 📍 DOVE SEI ADESSO

✅ Apollo installato sulla VM
✅ Servizio running
✅ Account Web UI creato (strike / Nosmoking93!!)
🔴 Pairing da fare

---

## 🚀 PROSSIMI 3 STEP

### 1️⃣ SULLA VM - Avvia Monitor PIN

```powershell
cd "C:\Program Files\Apollo"
powershell -ExecutionPolicy Bypass -File .\monitor-pin.ps1
```

**LASCIA QUESTA FINESTRA APERTA!**

---

### 2️⃣ SUL PC LOCALE - Implementa Client

Antigravity locale deve:
1. Creare `apollo/pairing.ts` (vedi PAIRING_INSTRUCTIONS.md)
2. Fare richiesta pairing ad Apollo
3. Apollo genera PIN → appare nel monitor VM
4. Antigravity invia PIN ad Apollo
5. Pairing completato!

---

### 3️⃣ CONFIGURAZIONE AZURE NSG

**IMPORTANTE**: Prima di testare dal PC locale, configura NSG:

```
Nome:   AllowApollo
Porte:  47990,47998-48010
Proto:  Any
Azione: Allow
```

---

## 🔐 COME FUNZIONA IL PIN

```
┌─────────────────┐                    ┌─────────────────┐
│  Strike Client  │                    │   Apollo (VM)   │
│   (PC Locale)   │                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. Request Pairing                  │
         │─────────────────────────────────────>│
         │                                      │
         │                                      │ 2. Generate PIN
         │                                      │    (es: 1234)
         │                                      │
         │  3. PIN: 1234                        │
         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
         │     (appare nei log VM)              │
         │                                      │
         │  4. Complete Pairing (PIN: 1234)     │
         │─────────────────────────────────────>│
         │                                      │
         │                                      │ 5. Verify PIN
         │                                      │    Create Cert
         │  6. Pairing Success + Cert           │
         │<─────────────────────────────────────│
         │                                      │
         │  7. Stream WebRTC                    │
         │<────────────────────────────────────>│
         │                                      │
```

---

## 📂 FILE CREATI

Sulla VM, ho creato:

1. **`monitor-pin.ps1`**
   - Script per vedere il PIN in tempo reale
   - Esegui PRIMA di avviare il client

2. **`PAIRING_INSTRUCTIONS.md`**
   - Istruzioni complete con codice TypeScript
   - Per Antigravity locale

3. **`SETUP_COMPLETE.md`**
   - Riepilogo setup Apollo

---

## ⚡ QUICK TEST

Per testare se Apollo è raggiungibile dal PC locale:

```bash
# Sul PC locale
curl -k https://<IP_PUBBLICO_VM>:47990

# Dovrebbe rispondere (anche se 401 Unauthorized è OK)
```

---

## 📞 IP PUBBLICO VM

Per trovare l'IP pubblico della VM:

**Azure Portal:**
1. Vai sulla VM
2. Guarda "Public IP address"

**PowerShell sulla VM:**
```powershell
Invoke-RestMethod -Uri 'https://api.ipify.org?format=json' | Select-Object -ExpandProperty ip
```

---

## ✅ CHECKLIST

- [ ] Monitor PIN avviato sulla VM
- [ ] Azure NSG configurato
- [ ] IP pubblico VM identificato
- [ ] Client pairing implementato (Antigravity locale)
- [ ] Test connessione da PC locale
- [ ] Pairing eseguito con PIN
- [ ] Streaming test

---

**QUANDO SEI PRONTO, DIMMI E PROCEDIAMO!** 🚀
