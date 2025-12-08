# DATABASE SYNC FIX
## Risoluzione Errore "startId property is not in the fields"

**Data**: 2025-12-05 19:55
**Errore**: `"startId" property is not in the fields`

---

## 🔍 PROBLEMA

Il database PostgreSQL ha uno schema vecchio che non corrisponde allo schema Prisma attuale.

L'errore indica che il database si aspetta un campo `startId` che non esiste nello schema Prisma.

---

## ✅ SOLUZIONE

### Opzione A: Reset Database (RACCOMANDATO per sviluppo)

```powershell
# 1. Naviga alla directory shared-db
cd "C:\Users\Domi\Desktop\Strike Antigravity\packages\shared-db"

# 2. Reset del database (ATTENZIONE: cancella tutti i dati!)
pnpm prisma migrate reset --force

# 3. Rigenera il client Prisma
pnpm prisma generate
```

### Opzione B: Push Schema (Senza cancellare dati)

```powershell
# 1. Naviga alla directory shared-db
cd "C:\Users\Domi\Desktop\Strike Antigravity\packages\shared-db"

# 2. Push dello schema al database
pnpm prisma db push --accept-data-loss

# 3. Rigenera il client Prisma
pnpm prisma generate
```

### Opzione C: Migrazione Manuale

```powershell
# 1. Naviga alla directory shared-db
cd "C:\Users\Domi\Desktop\Strike Antigravity\packages\shared-db"

# 2. Crea una nuova migrazione
pnpm prisma migrate dev --name remove_start_id_field

# 3. Applica la migrazione
pnpm prisma migrate deploy
```

---

## 🎯 DOPO IL FIX

1. **Riavvia tutti i servizi**:
   ```powershell
   # Ctrl+C in tutte le finestre
   # Poi riavvia con start-all.bat
   ```

2. **Testa di nuovo "Play Now"**

---

## 📝 NOTE

- Il database deve essere sincronizzato con lo schema Prisma
- L'Orchestrator usa in-memory storage per le sessioni (non Prisma)
- Il problema è probabilmente in un altro servizio che sta cercando di salvare nel database

---

**ESEGUI UNO DEI COMANDI SOPRA PER RISOLVERE!**
