# 🎯 GUIDA PAIRING SUNSHINE - Strike Gaming Cloud

**Data**: 08 Dicembre 2025, 18:40
**Obiettivo**: Completare il pairing tra Strike e Sunshine

---

## 📋 OPZIONI DISPONIBILI

### Opzione 1: Pairing Manuale (TU - Locale)
Completi il pairing dall'interfaccia web di Sunshine.

### Opzione 2: Pairing con Antigravity VM
Antigravity sulla VM completa il pairing localmente.

---

## 🎯 OPZIONE 1: PAIRING MANUALE (CONSIGLIATO)

### Step 1: Apri l'Interfaccia Sunshine
1. Apri il browser
2. Vai a: `https://20.31.130.73:47984`
3. Accetta l'avviso di sicurezza del certificato
4. Login con:
   - **Username**: `strike`
   - **Password**: `Nosmoking93!!`

### Step 2: Trova la Sezione Pairing
1. Cerca una sezione "Pairing" o "Devices" nell'interfaccia
2. Dovrebbe esserci un'opzione per "Add Device" o "Pair New Device"

### Step 3: Genera PIN
Ci sono due modi:

**Modo A: Dall'Interfaccia Sunshine**
- Clicca su "Add Device" o "Pair"
- Sunshine genererà un PIN automaticamente
- Copia il PIN

**Modo B: Dal Nostro Endpoint**
```powershell
curl http://localhost:3012/test/sunshine/pairing
```
(Questo potrebbe non funzionare senza pairing già completato)

### Step 4: Completa il Pairing
1. Inserisci il PIN nell'interfaccia Sunshine
2. Conferma il pairing
3. Sunshine dovrebbe mostrare "Device Paired Successfully"

### Step 5: Testa il Launch
Dopo il pairing, testa:
```powershell
curl http://localhost:3012/test/sunshine/launch
```

---

## 🎯 OPZIONE 2: PAIRING CON ANTIGRAVITY VM

Se preferisci, posso creare istruzioni per Antigravity VM per completare il pairing localmente sulla VM.

### Vantaggi
- Antigravity VM ha accesso diretto a Sunshine
- Può aprire l'interfaccia web localmente (`http://localhost:47984`)
- Può completare il pairing automaticamente

### Come Procedere
1. Creo un file `PAIRING_INSTRUCTIONS_FOR_VM.md`
2. Tu lo passi ad Antigravity VM
3. Antigravity VM esegue il pairing
4. Torniamo qui per testare il launch

---

## 💡 RACCOMANDAZIONE

**Opzione 1 è più veloce** se hai accesso al browser.

**Opzione 2 è più automatica** ma richiede coordinazione con Antigravity VM.

---

## 🔍 INFORMAZIONI UTILI

### Credenziali Sunshine
- **Username**: `strike`
- **Password**: `Nosmoking93!!`

### URL Interfaccia
- **HTTPS (Remoto)**: `https://20.31.130.73:47984`
- **HTTP (Locale VM)**: `http://localhost:47984`

### Apps Disponibili
1. Capcom Arcade Stadium
2. Desktop
3. Steam Big Picture

---

## 📝 DOPO IL PAIRING

Una volta completato il pairing, potremo:
1. ✅ Lanciare app da Strike
2. ✅ Testare lo streaming
3. ✅ Completare l'integrazione end-to-end

---

**Quale opzione preferisci?**
1. Pairing manuale (tu dal browser)
2. Pairing con Antigravity VM (automatico)

Fammi sapere e procediamo! 🚀
