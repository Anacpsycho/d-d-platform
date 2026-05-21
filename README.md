# 🎲 D&D 5E Character Sheet Application

Applicazione web completa per la gestione di personaggi e sessioni di Dungeons & Dragons 5a Edizione, con supporto real-time per il gioco online.

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Tecnologie](#-tecnologie)
- [Requisiti](#-requisiti)
- [Installazione Rapida](#-installazione-rapida)
- [Configurazione](#-configurazione)
- [Utilizzo](#-utilizzo)
- [Architettura](#-architettura)
- [Sviluppo](#-sviluppo)
- [Documentazione](#-documentazione)
- [Licenza](#-licenza)

## ✨ Caratteristiche

### Gestione Personaggi
- ✅ Creazione e modifica completa schede personaggio D&D 5E
- ✅ Calcolo automatico di statistiche, bonus e modificatori
- ✅ Gestione inventario, equipaggiamento e incantesimi
- ✅ Tracciamento punti ferita, slot incantesimi e risorse
- ✅ Sistema di livellamento automatico

### Sessioni di Gioco
- ✅ Creazione e gestione campagne
- ✅ Sistema di inviti per giocatori
- ✅ Chat in tempo reale con WebSocket
- ✅ Tracker iniziativa per combattimenti
- ✅ Lancio dadi integrato con notifiche real-time
- ✅ Gestione eventi di gioco (danni, cure, riposi)

### Strumenti Master
- ✅ Gestione NPC e mostri
- ✅ Sistema di messaggistica per comunicazioni private
- ✅ Controllo completo delle sessioni
- ✅ Visualizzazione stato di tutti i personaggi

### Funzionalità Avanzate
- ✅ Import/Export personaggi
- ✅ Sistema di backup automatico
- ✅ Supporto multi-campagna
- ✅ Responsive design per mobile e desktop

## 🛠️ Tecnologie

### Backend
- **NestJS** - Framework Node.js enterprise
- **MongoDB** - Database NoSQL
- **Redis** - Cache e gestione sessioni
- **WebSocket** - Comunicazione real-time
- **JWT** - Autenticazione sicura

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool veloce
- **Material-UI** - Component library
- **Socket.io** - WebSocket client

### Infrastructure
- **Podman** - Container runtime
- **Nginx** - Reverse proxy
- **Docker** - Containerizzazione (alternativa)

## 📦 Requisiti

### Software Necessario
- **Podman Desktop** ([Download](https://podman-desktop.io/)) o Docker Desktop
- **Windows PowerShell** 5.1+ (Windows) o Bash (Linux/Mac)
- **4GB RAM** minimo disponibili
- **2GB spazio disco** per immagini e dati

### Porte Richieste
Le seguenti porte devono essere libere:
- `80` - Nginx (accesso principale)
- `3000` - Backend API
- `8080` - Frontend
- `27017` - MongoDB
- `6379` - Redis

## 🚀 Installazione Rapida

### Windows (Podman)

```powershell
# 1. Clona il repository
git clone <repository-url>
cd dnd-character-sheet

# 2. Avvia tutto (build + run)
.\podman-setup.ps1

# 3. Apri il browser
start http://localhost
```

### Linux/Mac (Podman)

```bash
# 1. Clona il repository
git clone <repository-url>
cd dnd-character-sheet

# 2. Converti script per bash (se necessario)
# Oppure usa i comandi manuali sotto

# 3. Build e avvio manuale
# Vedi sezione "Installazione Manuale" sotto
```

### Installazione Manuale (Tutti i sistemi)

```bash
# 1. Crea network
podman network create dnd-network

# 2. Crea directory dati
mkdir -p data/mongodb data/redis

# 3. Build immagini
cd backend && podman build -t localhost/dnd-backend:latest -f Containerfile . && cd ..
cd frontend && podman build -t localhost/dnd-frontend:latest -f Containerfile . && cd ..
cd nginx && podman build -t localhost/dnd-nginx:latest -f Containerfile . && cd ..

# 4. Avvia MongoDB
podman run -d --name dnd-mongodb --network dnd-network \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme123 \
  -e MONGO_INITDB_DATABASE=dnd \
  -v ./data/mongodb:/data/db:Z \
  docker.io/library/mongo:6

# 5. Avvia Redis
podman run -d --name dnd-redis --network dnd-network \
  -p 6379:6379 \
  -v ./data/redis:/data:Z \
  docker.io/library/redis:7-alpine redis-server --appendonly yes

# 6. Avvia Backend
podman run -d --name dnd-backend --network dnd-network \
  -p 3000:3000 \
  -e DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin \
  -e REDIS_URL=redis://dnd-redis:6379 \
  localhost/dnd-backend:latest

# 7. Avvia Frontend
podman run -d --name dnd-frontend --network dnd-network \
  -p 8080:8080 \
  localhost/dnd-frontend:latest

# 8. Avvia Nginx
podman run -d --name dnd-nginx --network dnd-network \
  -p 80:80 \
  localhost/dnd-nginx:latest
```

## ⚙️ Configurazione

### Variabili Ambiente

#### Backend (`backend/.env`)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://dnd-redis:6379
CORS_ORIGIN=http://localhost
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Database MongoDB

**Credenziali di default:**
- Username: `admin`
- Password: `changeme123`
- Database: `dnd`

⚠️ **IMPORTANTE**: Cambia la password in produzione!

**Inizializzazione:**
- MongoDB si inizializza automaticamente al primo avvio
- Il backend crea automaticamente tutte le collections necessarie
- I dati sono persistiti in `./data/mongodb`

**Accesso al database:**
```bash
podman exec -it dnd-mongodb mongosh -u admin -p changeme123
```

## 🎮 Utilizzo

### Primo Accesso

1. Apri il browser su http://localhost
2. Clicca su "Registrati"
3. Crea un nuovo account
4. Effettua il login

### Creare un Personaggio

1. Dalla dashboard, clicca "Nuovo Personaggio"
2. Compila i dati base (nome, razza, classe)
3. Assegna i punteggi caratteristica
4. Seleziona competenze e equipaggiamento
5. Salva il personaggio

### Creare una Campagna

1. Vai su "Campagne"
2. Clicca "Nuova Campagna"
3. Inserisci nome e descrizione
4. Invita i giocatori tramite codice invito

### Avviare una Sessione

1. Apri la campagna
2. Clicca "Avvia Sessione"
3. I giocatori possono unirsi
4. Usa gli strumenti: chat, dadi, tracker iniziativa

## 🏗️ Architettura

### Container

| Nome | Immagine | Porta | Descrizione |
|------|----------|-------|-------------|
| dnd-mongodb | mongo:6 | 27017 | Database principale |
| dnd-redis | redis:7-alpine | 6379 | Cache e sessioni |
| dnd-backend | localhost/dnd-backend | 3000 | API REST + WebSocket |
| dnd-frontend | localhost/dnd-frontend | 8080 | React SPA |
| dnd-nginx | localhost/dnd-nginx | 80 | Reverse proxy |

### Struttura Progetto

```
.
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/     # Moduli funzionali
│   │   ├── common/      # Utilities condivise
│   │   └── config/      # Configurazioni
│   └── Containerfile
├── frontend/            # React App
│   ├── src/
│   │   ├── components/  # Componenti React
│   │   ├── pages/       # Pagine
│   │   ├── services/    # API clients
│   │   └── hooks/       # Custom hooks
│   └── Containerfile
├── nginx/               # Reverse proxy
│   ├── nginx.conf
│   └── Containerfile
├── data/                # Dati persistenti
│   ├── mongodb/
│   └── redis/
├── docs/                # Documentazione
└── podman-setup.ps1     # Script setup
```

## 💻 Sviluppo

### Setup Ambiente di Sviluppo

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in un altro terminale)
cd frontend
npm install
npm run dev
```

### Comandi Utili

```bash
# Verifica stato container
podman ps

# Logs
podman logs -f dnd-backend
podman logs -f dnd-frontend

# Accesso shell
podman exec -it dnd-backend sh
podman exec -it dnd-mongodb mongosh -u admin -p changeme123

# Riavvio singolo container
podman restart dnd-backend

# Stop tutto
podman stop dnd-mongodb dnd-redis dnd-backend dnd-frontend dnd-nginx
```

### Testing

```bash
# Backend unit tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📚 Documentazione

- **[Setup Podman Completo](docs/PODMAN_SETUP.md)** - Guida dettagliata Podman
- **[Guida Implementazione](docs/IMPLEMENTATION_GUIDE.md)** - Dettagli tecnici
- **[Roadmap](docs/IMPLEMENTATION_ROADMAP.md)** - Piano di sviluppo
- **[Specifiche Tecniche](docs/COMPLETE_TECHNICAL_SPECIFICATION.md)** - Architettura completa

### Sistemi Documentati

- [Sistema Gestione Campagne](docs/CAMPAIGN_MANAGEMENT_SYSTEM.md)
- [Sistema Eventi di Gioco](docs/GAME_SESSION_EVENTS_SYSTEM.md)
- [Sistema Messaggistica](docs/MASTER_TOOLS_AND_MESSAGING_SYSTEM.md)
- [Sistema Import Script](docs/CUSTOM_SCRIPT_IMPORT_SYSTEM.md)

## 🐛 Troubleshooting

### Porta già in uso
```bash
# Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :80
kill -9 <PID>
```

### Container non si avvia
```bash
# Controlla logs
podman logs dnd-backend

# Riavvia
podman restart dnd-backend
```

### Reset completo
```bash
# Windows
.\podman-setup.ps1 -Clean

# Manuale
podman stop dnd-mongodb dnd-redis dnd-backend dnd-frontend dnd-nginx
podman rm dnd-mongodb dnd-redis dnd-backend dnd-frontend dnd-nginx
podman network rm dnd-network
rm -rf data/
```

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 👥 Autori

- **Sviluppatore Principale** - Progetto personale

## 🙏 Ringraziamenti

- Wizards of the Coast per D&D 5E
- Community open source
- [D&D 5E API](https://www.dnd5eapi.co/) per i dati SRD

---

**Buon gioco! 🎲✨**

Per supporto o domande, apri una issue su GitHub.