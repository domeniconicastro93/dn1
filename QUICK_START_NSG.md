# 🚀 QUICK START: Configura NSG Azure (5 minuti)

## 🎯 Cosa Fare ADESSO

### Step 1: Accedi ad Azure
1. Vai su: **https://portal.azure.com**
2. Accedi con le tue credenziali

### Step 2: Trova la VM
1. Cerca "Macchine virtuali" nella barra di ricerca
2. Clicca sulla VM con IP **20.31.130.73**

### Step 3: Vai alle Regole di Rete
1. Nel menu laterale della VM, clicca su **"Rete"** (Networking)
2. Clicca su **"Regole porta in ingresso"** (Inbound port rules)

### Step 4: Aggiungi 4 Regole

Clicca **"Aggiungi regola porta in ingresso"** e crea queste 4 regole:

#### ⭐ Regola 1: Porta 47990 (PRINCIPALE)
```
Destination port ranges: 47990
Protocol: TCP
Action: Allow
Priority: 1010
Name: Sunshine-HTTPS-API
```

#### Regola 2: Porta 47984
```
Destination port ranges: 47984
Protocol: TCP
Action: Allow
Priority: 1011
Name: Sunshine-HTTPS-Web
```

#### Regola 3: Porta 47985
```
Destination port ranges: 47985
Protocol: TCP
Action: Allow
Priority: 1012
Name: Sunshine-HTTP-API
```

#### Regola 4: Porta 47989
```
Destination port ranges: 47989
Protocol: TCP
Action: Allow
Priority: 1013
Name: Sunshine-RTSP
```

### Step 5: Salva e Aspetta
1. Clicca **"Aggiungi"** per ogni regola
2. Aspetta 1-2 minuti che le regole si applichino

### Step 6: Dimmi che hai finito
Scrivi semplicemente:
```
Antigravity, ho configurato NSG Azure
```

---

## 🎮 Cosa Succederà Dopo

Quando mi confermi, io:
1. ✅ Testerò la connessione a Sunshine
2. ✅ Verificherò il pairing
3. ✅ Testerò il lancio giochi
4. ✅ Confermerò che tutto funziona
5. 🎉 **Strike sarà connesso a Sunshine!**

---

## 📸 Screenshot di Riferimento

Quando sei su "Regole porta in ingresso", vedrai:
- Una lista di regole esistenti
- Un pulsante **"+ Aggiungi regola porta in ingresso"**
- Clicca quel pulsante per ogni porta

Nel form di creazione regola:
- Lascia tutto di default
- Cambia solo: **Destination port ranges**, **Name**, **Priority**
- Clicca **"Aggiungi"**

---

**Tempo totale**: 5-10 minuti  
**Difficoltà**: Facile 😊  
**Risultato**: Strike connesso a Sunshine! 🎮🚀
