# 🎲 D&D Character Sheet - Guida Podman Completa

Guida unificata per installare e avviare l'applicazione D&D Character Sheet usando Podman con container singoli.

## 📋 Indice

1. [Prerequisiti](#prerequisiti)
2. [Installazione Rapida](#installazione-rapida)
3. [Comandi Principali](#comandi-principali)
4. [Architettura](#architettura)
5. [Configurazione](#configurazione)
6. [Troubleshooting](#troubleshooting)
7. [Comandi Avanzati](#comandi-avanzati)

---

## 📦 Prerequisiti

- **Podman Desktop** installato ([Download](https://podman-desktop.io/))
- **Windows PowerShell** 5.1 o superiore
- Almeno **4GB RAM** disponibili
- Porte libere: **80, 3000, 8080, 27017, 6379**

### Verifica Podman

```powershell
podman --version
```

Se non funziona, installa Podman Desktop e riavvia il terminale.

---

## 🚀 Installazione Rapida

### Metodo 1: Script Automatico (Consigliato)

```powershell
# Setup completo (build + avvio)
.\podman-setup.ps1
```

Questo comando:
- ✅ Verifica Podman
- ✅ Compila tutte le immagini (5-10 minuti)
- ✅ Crea il network
- ✅ Avvia tutti i container
- ✅ Apre il browser

### Metodo 2: Passo per Passo

```powershell
# 1. Build immagini
cd backend
podman build -t localhost/dnd-backend:latest -f Containerfile .
cd ..

cd frontend
podman build -t localhost/dnd-frontend:latest -f Containerfile .
cd ..

cd nginx
podman build -t localhost/dnd-nginx:latest -f Containerfile .
cd ..

# 2. Crea network
podman network create dnd-network

# 3. Crea directory dati
New-Item -ItemType Directory -Force -Path .\data\mongodb
New-Item -ItemType Directory -Force -Path .\data\redis

# 4. Avvia MongoDB
podman run -d `
    --name dnd-mongodb `
    --network dnd-network `
    -p 27017:27017 `
    -e MONGO_INITDB_ROOT_USERNAME=admin `
    -e MONGO_INITDB_ROOT_PASSWORD=changeme123 `
    -e MONGO_INITDB_DATABASE=dnd `
    -v ${PWD}/data/mongodb:/data/db:Z `
    docker.io/library/mongo:6

# 5. Avvia Redis
podman run -d `
    --name dnd-redis `
    --network dnd-network `
    -p 6379:6379 `
    -v ${PWD}/data/redis:/data:Z `
    docker.io/library/redis:7-alpine redis-server --appendonly yes

# 6. Avvia Backend
podman run -d `
    --name dnd-backend `
    --network dnd-network `
    -p 3000:3000 `
    -e DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin `
    -e REDIS_URL=redis://dnd-redis:6379 `
    localhost/dnd-backend:latest

# 7. Avvia Frontend
podman run -d `
    --name dnd-frontend `
    --network dnd-network `
    -p 8080:8080 `
    localhost/dnd-frontend:latest

# 8. Avvia Nginx
podman run -d `
    --name dnd-nginx `
    --network dnd-network `
    -p 80:80 `
    localhost/dnd-nginx:latest
```

---

## 🎮 Comandi Principali

### Avvio

```powershell
# Setup completo (prima volta)
.\podman-setup.ps1

# Solo avvio (se già buildato)
.\podman-setup.ps1
```

### Verifica Stato

```powershell
# Verifica completa
.\podman-setup.ps1 -Check

# Lista container
podman ps

# Stato specifico
podman ps -a --filter name=dnd-
```

### Arresto

```powershell
# Ferma tutto
.\podman-setup.ps1 -Stop

# Ferma singolo container
podman stop dnd-backend
```

### Logs

```powershell
# Logs backend (live)
podman logs -f dnd-backend

# Logs MongoDB
podman logs -f dnd-mongodb

# Logs frontend
podman logs -f dnd-frontend

# Ultimi 100 log
podman logs --tail 100 dnd-backend
```

### Pulizia

```powershell
# Pulizia completa (container + immagini + dati)
.\podman-setup.ps1 -Clean

# Solo container
podman stop dnd-mongodb dnd-redis dnd-backend dnd-frontend dnd-nginx
podman rm dnd-mongodb dnd-redis dnd-backend dnd-frontend dnd-nginx
```

---

## 🏗️ Architettura

### Container

| Nome | Immagine | Porta | Descrizione |
|------|----------|-------|-------------|
| **dnd-mongodb** | mongo:6 | 27017 | Database principale |
| **dnd-redis** | redis:7-alpine | 6379 | Cache e sessioni |
| **dnd-backend** | localhost/dnd-backend:latest | 3000 | API NestJS + WebSocket |
| **dnd-frontend** | localhost/dnd-frontend:latest | 8080 | React + Vite |
| **dnd-nginx** | localhost/dnd-nginx:latest | 80 | Reverse proxy |

### Network

Tutti i container sono connessi al network `dnd-network` per comunicare tra loro.

### Volumi

- `./data/mongodb` → MongoDB data
- `./data/redis` → Redis data

---

## ⚙️ Configurazione

### Variabili Ambiente Backend

File: [`backend/.env`](backend/.env:1)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_URL=redis://dnd-redis:6379
```

### Variabili Ambiente Frontend

File: [`frontend/.env`](frontend/.env:1)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Credenziali MongoDB

- **Username**: `admin`
- **Password**: `changeme123`
- **Database**: `dnd`

⚠️ **IMPORTANTE**: Cambia la password in produzione!

---

## 🌐 Accesso

Dopo l'avvio, l'applicazione è disponibile su:

- **Applicazione principale**: http://localhost
- **Backend API**: http://localhost:3000
- **Frontend diretto**: http://localhost:8080

### Primi Passi

1. Apri http://localhost
2. Registra un nuovo account
3. Crea il tuo primo personaggio
4. Inizia a giocare!

---

## 🐛 Troubleshooting

### Problema: Porta già in uso

```powershell
# Trova processo
netstat -ano | findstr :80

# Termina processo (sostituisci PID)
taskkill /PID <PID> /F
```

### Problema: Container non si avvia

```powershell
# Controlla logs
podman logs dnd-backend

# Riavvia container
podman restart dnd-backend

# Riavvia tutto
.\podman-setup.ps1 -Stop
.\podman-setup.ps1
```

### Problema: MongoDB non si connette

```powershell
# Verifica MongoDB
podman exec -it dnd-mongodb mongosh -u admin -p changeme123

# Test connessione
podman exec -it dnd-mongodb mongosh --eval "db.adminCommand('ping')"

# Controlla logs
podman logs dnd-mongodb
```

### Problema: Backend non raggiunge MongoDB

```powershell
# Verifica network
podman network inspect dnd-network

# Verifica che i container siano nella stessa rete
podman inspect dnd-backend | Select-String "dnd-network"
podman inspect dnd-mongodb | Select-String "dnd-network"
```

### Problema: Build fallisce

```powershell
# Pulisci cache
podman system prune -a -f

# Riprova build
.\podman-setup.ps1
```

### Problema: Errore permessi su volumi

```powershell
# Ricrea directory con permessi corretti
Remove-Item -Recurse -Force .\data
New-Item -ItemType Directory -Force -Path .\data\mongodb
New-Item -ItemType Directory -Force -Path .\data\redis
```

---

## 🔧 Comandi Avanzati

### Accesso ai Container

```powershell
# Shell backend
podman exec -it dnd-backend sh

# Shell MongoDB
podman exec -it dnd-mongodb mongosh -u admin -p changeme123

# Shell Redis
podman exec -it dnd-redis redis-cli
```

### Backup Database

```powershell
# Backup MongoDB
podman exec dnd-mongodb mongodump --username admin --password changeme123 --authenticationDatabase admin --out /backup
podman cp dnd-mongodb:/backup ./backup-$(Get-Date -Format 'yyyyMMdd')
```

### Restore Database

```powershell
# Restore MongoDB
podman cp ./backup dnd-mongodb:/backup
podman exec dnd-mongodb mongorestore --username admin --password changeme123 --authenticationDatabase admin /backup
```

### Monitoraggio Risorse

```powershell
# Statistiche live
podman stats

# Statistiche specifiche
podman stats dnd-backend dnd-mongodb
```

### Rebuild Singolo Container

```powershell
# Esempio: rebuild solo backend
cd backend
podman build -t localhost/dnd-backend:latest -f Containerfile .
cd ..

# Riavvia solo backend
podman stop dnd-backend
podman rm dnd-backend
podman run -d `
    --name dnd-backend `
    --network dnd-network `
    -p 3000:3000 `
    -e DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin `
    localhost/dnd-backend:latest
```

### Esporta/Importa Immagini

```powershell
# Esporta
podman save -o dnd-backend.tar localhost/dnd-backend:latest

# Importa
podman load -i dnd-backend.tar
```

---

## 🔐 Sicurezza

### Per Produzione

1. **Cambia password MongoDB** in [`podman-setup.ps1`](podman-setup.ps1:1)
2. **Cambia JWT_SECRET** in [`backend/.env`](backend/.env:1)
3. **Usa HTTPS** con certificati SSL
4. **Non esporre** MongoDB e Redis pubblicamente
5. **Usa secrets** invece di variabili hardcoded

### Esempio con Secrets

```powershell
# Crea secret
echo "my-super-secret" | podman secret create jwt_secret -

# Usa nel container
podman run -d `
    --name dnd-backend `
    --secret jwt_secret `
    ...
```

---

## 📊 Struttura File

```
.
├── backend/
│   ├── Containerfile          # Dockerfile backend
│   ├── .env                    # Config backend
│   └── src/                    # Codice sorgente
├── frontend/
│   ├── Containerfile          # Dockerfile frontend
│   ├── .env                    # Config frontend
│   └── src/                    # Codice sorgente
├── nginx/
│   ├── Containerfile          # Dockerfile nginx
│   └── nginx.conf             # Config nginx
├── data/
│   ├── mongodb/               # Dati MongoDB (persistenti)
│   └── redis/                 # Dati Redis (persistenti)
├── podman-setup.ps1           # Script principale
└── README_PODMAN.md           # Questa guida
```

---

## 📚 Risorse

- [Podman Documentation](https://docs.podman.io/)
- [Podman Desktop](https://podman-desktop.io/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Redis Docker](https://hub.docker.com/_/redis)

---

## 🆘 Supporto

### Diagnostica Rapida

```powershell
# Verifica completa
.\podman-setup.ps1 -Check

# Logs di tutti i container
podman logs dnd-mongodb
podman logs dnd-redis
podman logs dnd-backend
podman logs dnd-frontend
podman logs dnd-nginx
```

### Reset Completo

```powershell
# Pulisci tutto e ricomincia
.\podman-setup.ps1 -Clean
.\podman-setup.ps1
```

---

**Buon gioco! 🎲✨**