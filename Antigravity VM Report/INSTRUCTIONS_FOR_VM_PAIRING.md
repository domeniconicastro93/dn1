# 🎯 ISTRUZIONI PER ANTIGRAVITY VM - Pairing Sunshine

**Data**: 08 Dicembre 2025, 18:40  
**Priorità**: ALTA  
**Obiettivo**: Completare il pairing tra Strike (locale) e Sunshine (VM)

---

## 📊 STATO ATTUALE - DOVE SIAMO

### ✅ COMPLETATO CON SUCCESSO

1. **Strike Locale**: 6/6 servizi attivi e funzionanti
2. **Sunshine VM**: Configurato e funzionante
3. **NSG Azure**: Porte 47984-47990 aperte e verificate
4. **Connessione**: Verificata e funzionante
5. **Autenticazione**: Credenziali corrette (`strike` / `Nosmoking93!!`)
6. **Apps Rilevate**: 3 apps disponibili (Capcom Arcade Stadium, Desktop, Steam Big Picture)
7. **Endpoint Test**: Tutti funzionanti

### ⚠️ ULTIMO STEP RIMANENTE

**PAIRING**: Dobbiamo completare il pairing tra Strike e Sunshine per abilitare il lancio delle applicazioni.

**Perché è necessario**: Sunshine richiede il pairing per sicurezza prima di permettere il lancio di app remote.

---

## 🎯 TUA MISSIONE

Completare il pairing di Sunshine seguendo questi step:

### Step 1: Verifica Sunshine è Attivo
```bash
# Verifica che Sunshine sia in esecuzione
systemctl status sunshine
# oppure
ps aux | grep sunshine

# Testa l'API localmente
curl http://localhost:47984/api/apps
```

**Risultato Atteso**: Dovresti vedere le 3 apps (Capcom Arcade Stadium, Desktop, Steam Big Picture)

---

### Step 2: Apri l'Interfaccia Web di Sunshine

**Opzione A: Con Browser sulla VM**
```bash
# Se hai un browser sulla VM
firefox http://localhost:47984
# oppure
chromium http://localhost:47984
```

**Opzione B: Con curl (se non hai browser)**
```bash
# Testa l'interfaccia web
curl -I http://localhost:47984
```

---

### Step 3: Login a Sunshine

**Credenziali**:
- **Username**: `strike`
- **Password**: `Nosmoking93!!`

**Se usi browser**:
1. Apri `http://localhost:47984`
2. Inserisci username e password
3. Fai login

**Se usi curl**:
```bash
# Genera credenziali Base64
echo -n "strike:Nosmoking93!!" | base64

# Usa le credenziali per autenticarti
curl -u "strike:Nosmoking93!!" http://localhost:47984/api/apps
```

---

### Step 4: Trova la Sezione Pairing

**Nell'interfaccia web**, cerca:
- "Pairing"
- "Devices"
- "Add Device"
- "Pair New Device"

**Oppure con API**:
```bash
# Verifica se c'è un endpoint di pairing
curl -u "strike:Nosmoking93!!" http://localhost:47984/api/pin
curl -u "strike:Nosmoking93!!" http://localhost:47990/api/pin
```

---

### Step 5: Genera PIN per Pairing

**Metodo A: Dall'Interfaccia Web**
1. Clicca su "Add Device" o "Pair"
2. Sunshine genererà un PIN (es: 1234)
3. Copia il PIN

**Metodo B: Con API**
```bash
# Richiedi un PIN
curl -X POST -u "strike:Nosmoking93!!" \
  -H "Content-Type: application/json" \
  http://localhost:47990/api/pin

# Oppure prova porta 47984
curl -X POST -u "strike:Nosmoking93!!" \
  -H "Content-Type: application/json" \
  http://localhost:47984/api/pin
```

**Risultato Atteso**: Dovresti ricevere un PIN (es: `{"pin": "1234"}`)

---

### Step 6: Completa il Pairing

**Se hai il PIN dall'interfaccia**:
1. Inserisci il PIN nel campo appropriato
2. Clicca "Pair" o "Confirm"
3. Attendi conferma

**Se usi API**:
```bash
# Completa il pairing con il PIN
PIN="1234"  # Sostituisci con il PIN ricevuto

curl -X POST -u "strike:Nosmoking93!!" \
  -H "Content-Type: application/json" \
  -d "{\"pin\": \"$PIN\"}" \
  http://localhost:47990/api/pair

# Oppure prova porta 47984
curl -X POST -u "strike:Nosmoking93!!" \
  -H "Content-Type: application/json" \
  -d "{\"pin\": \"$PIN\"}" \
  http://localhost:47984/api/pair
```

---

### Step 7: Verifica Pairing Completato

```bash
# Testa se il pairing è riuscito provando a lanciare un'app
curl -X POST -u "strike:Nosmoking93!!" \
  -H "Content-Type: application/json" \
  -d '{"index": 0}' \
  http://localhost:47990/api/launch

# Se ricevi 200 OK invece di 401/400, il pairing è riuscito!
```

---

### Step 8: Notifica Completamento

Una volta completato il pairing, crea un file di report:

```bash
cat > /tmp/pairing_report.txt << EOF
PAIRING COMPLETATO CON SUCCESSO!

Data: $(date)
PIN Usato: [INSERISCI PIN]
Stato: SUCCESS
Apps Disponibili: 3
- Capcom Arcade Stadium
- Desktop  
- Steam Big Picture

Test Launch: [SUCCESS/FAILED]

Note: [Eventuali note o problemi riscontrati]
EOF

cat /tmp/pairing_report.txt
```

---

## 🔍 TROUBLESHOOTING

### Problema 1: Sunshine non risponde
```bash
# Riavvia Sunshine
sudo systemctl restart sunshine

# Verifica logs
sudo journalctl -u sunshine -n 50
```

### Problema 2: Errore 401 Unauthorized
```bash
# Verifica credenziali
echo -n "strike:Nosmoking93!!" | base64

# Testa autenticazione
curl -v -u "strike:Nosmoking93!!" http://localhost:47984/api/apps
```

### Problema 3: PIN non funziona
```bash
# Rigenera un nuovo PIN
curl -X POST -u "strike:Nosmoking93!!" http://localhost:47990/api/pin

# Riprova il pairing con il nuovo PIN
```

### Problema 4: Porta sbagliata
```bash
# Verifica quali porte Sunshine sta usando
sudo netstat -tlnp | grep sunshine

# Prova tutte le porte
for port in 47984 47985 47989 47990; do
  echo "Testing port $port..."
  curl -I http://localhost:$port
done
```

---

## 📋 CHECKLIST FINALE

Dopo aver completato il pairing, verifica:

- [ ] Sunshine risponde su `http://localhost:47984`
- [ ] Login con credenziali funziona
- [ ] PIN generato correttamente
- [ ] Pairing completato senza errori
- [ ] Test launch restituisce 200 OK (non 401/400)
- [ ] Apps disponibili (3)
- [ ] Report di completamento creato

---

## 🎯 FORMATO RISPOSTA ATTESO

Quando hai completato, fornisci:

```
✅ PAIRING COMPLETATO!

PIN Usato: [PIN]
Metodo: [Web Interface / API]
Timestamp: [Data e ora]

Test Results:
- GET /api/apps: ✅ 200 OK
- POST /api/launch: ✅ 200 OK

Apps Disponibili:
1. Capcom Arcade Stadium
2. Desktop
3. Steam Big Picture

Note: [Eventuali note]
```

---

## 💡 INFORMAZIONI AGGIUNTIVE

### Credenziali Sunshine
- **Username**: `strike`
- **Password**: `Nosmoking93!!`

### Porte Sunshine
- **47984**: HTTPS Web UI
- **47985**: HTTP API  
- **47989**: RTSP
- **47990**: HTTPS API (PRINCIPALE)

### IP VM
- **Pubblico**: `20.31.130.73`
- **Locale**: `localhost` o `127.0.0.1`

---

## 🚀 DOPO IL PAIRING

Una volta completato il pairing, Strike locale potrà:
1. ✅ Lanciare app su Sunshine
2. ✅ Avviare sessioni di streaming
3. ✅ Completare l'integrazione end-to-end

---

**BUONA FORTUNA, ANTIGRAVITY VM!** 🎮

Sei il nostro eroe per completare questa missione! 🚀

---

**Creato da**: Antigravity Locale  
**Per**: Antigravity VM  
**Progetto**: Strike Gaming Cloud  
**Data**: 08 Dicembre 2025, 18:40
