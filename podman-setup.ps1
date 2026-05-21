#!/usr/bin/env pwsh
# Script completo per setup e avvio con Podman usando container singoli
# D&D Character Sheet Application

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║        🎲 D&D Character Sheet - Setup Podman 🎲           ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Parametri
param(
    [switch]$Stop,
    [switch]$Check,
    [switch]$Clean
)

# Funzione per gestire errori
function Test-LastCommand {
    param([string]$ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERRORE: $ErrorMessage" -ForegroundColor Red
        exit 1
    }
}

# Funzione per mostrare progress
function Show-Progress {
    param([string]$Message, [int]$Step, [int]$Total)
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor Yellow
    Write-Host ("─" * 60) -ForegroundColor Gray
}

# STOP: Ferma tutti i container
if ($Stop) {
    Write-Host "🛑 Arresto container..." -ForegroundColor Yellow
    Write-Host ""
    
    $containers = @("dnd-nginx", "dnd-frontend", "dnd-backend", "dnd-redis", "dnd-mongodb")
    foreach ($container in $containers) {
        $exists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^$container$" -Quiet
        if ($exists) {
            Write-Host "   Fermo $container..." -ForegroundColor Gray
            podman stop $container 2>$null
            podman rm $container 2>$null
        }
    }
    
    # Rimuovi network
    $networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^dnd-network$" -Quiet
    if ($networkExists) {
        Write-Host "   Rimuovo network..." -ForegroundColor Gray
        podman network rm dnd-network 2>$null
    }
    
    Write-Host ""
    Write-Host "✅ Container fermati!" -ForegroundColor Green
    
    $response = Read-Host "Vuoi rimuovere anche i dati? (s/n)"
    if ($response -eq "s" -or $response -eq "S") {
        if (Test-Path ".\data") {
            Remove-Item -Recurse -Force ".\data"
            Write-Host "✅ Dati rimossi!" -ForegroundColor Green
        }
    }
    exit 0
}

# CHECK: Verifica stato
if ($Check) {
    Write-Host "🔍 Verifica stato sistema..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verifica Podman
    Write-Host "1️⃣  Podman:" -ForegroundColor Cyan
    podman --version
    Write-Host ""
    
    # Verifica Network
    Write-Host "2️⃣  Network:" -ForegroundColor Cyan
    $networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^dnd-network$" -Quiet
    if ($networkExists) {
        Write-Host "   ✅ dnd-network presente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ dnd-network mancante" -ForegroundColor Red
    }
    Write-Host ""
    
    # Verifica Container
    Write-Host "3️⃣  Container:" -ForegroundColor Cyan
    podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
    
    # Verifica Immagini
    Write-Host "4️⃣  Immagini:" -ForegroundColor Cyan
    podman images | Select-String "dnd-"
    Write-Host ""
    
    # Test connettività
    Write-Host "5️⃣  Test Servizi:" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✅ Backend API - OK" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Backend API - Non risponde" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✅ Frontend - OK" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Frontend - Non risponde" -ForegroundColor Red
    }
    
    exit 0
}

# CLEAN: Pulizia completa
if ($Clean) {
    Write-Host "🗑️  Pulizia completa..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  ATTENZIONE: Questo rimuoverà:" -ForegroundColor Red
    Write-Host "   - Tutti i container" -ForegroundColor Red
    Write-Host "   - Tutte le immagini" -ForegroundColor Red
    Write-Host "   - Tutti i dati" -ForegroundColor Red
    Write-Host ""
    $response = Read-Host "Sei sicuro? (scrivi 'SI' per confermare)"
    
    if ($response -eq "SI") {
        # Ferma e rimuovi container
        $containers = @("dnd-nginx", "dnd-frontend", "dnd-backend", "dnd-redis", "dnd-mongodb")
        foreach ($container in $containers) {
            podman stop $container 2>$null
            podman rm $container 2>$null
        }
        
        # Rimuovi network
        podman network rm dnd-network 2>$null
        
        # Rimuovi immagini
        podman rmi localhost/dnd-backend:latest 2>$null
        podman rmi localhost/dnd-frontend:latest 2>$null
        podman rmi localhost/dnd-nginx:latest 2>$null
        
        # Rimuovi dati
        if (Test-Path ".\data") {
            Remove-Item -Recurse -Force ".\data"
        }
        
        Write-Host "✅ Pulizia completata!" -ForegroundColor Green
    } else {
        Write-Host "❌ Operazione annullata" -ForegroundColor Yellow
    }
    exit 0
}

# SETUP E AVVIO NORMALE
Write-Host "🚀 Avvio setup completo..." -ForegroundColor Cyan
Write-Host ""

# STEP 1: Verifica Podman
Show-Progress "Verifica Podman" 1 6
podman --version
Test-LastCommand "Podman non installato. Scarica da: https://podman-desktop.io/"
Write-Host "✅ Podman OK" -ForegroundColor Green

# STEP 2: Build immagini
Show-Progress "Build immagini (5-10 minuti)" 2 6

Write-Host "📦 Backend..." -ForegroundColor Cyan
Set-Location backend
podman build -t localhost/dnd-backend:latest -f Containerfile .
Test-LastCommand "Build backend fallita"
Set-Location ..
Write-Host "   ✅ Backend" -ForegroundColor Green

Write-Host "📦 Frontend..." -ForegroundColor Cyan
Set-Location frontend
podman build -t localhost/dnd-frontend:latest -f Containerfile `
    --build-arg VITE_API_URL=http://localhost:3000 `
    --build-arg VITE_WS_URL=http://localhost:3000 .
Test-LastCommand "Build frontend fallita"
Set-Location ..
Write-Host "   ✅ Frontend" -ForegroundColor Green

Write-Host "📦 Nginx..." -ForegroundColor Cyan
Set-Location nginx
podman build -t localhost/dnd-nginx:latest -f Containerfile .
Test-LastCommand "Build nginx fallita"
Set-Location ..
Write-Host "   ✅ Nginx" -ForegroundColor Green

# STEP 3: Preparazione
Show-Progress "Preparazione ambiente" 3 6

# Crea directory dati
Write-Host "📁 Directory dati..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path ".\data\mongodb" | Out-Null
New-Item -ItemType Directory -Force -Path ".\data\redis" | Out-Null
Write-Host "   ✅ Directory create" -ForegroundColor Green

# Crea network
Write-Host "🌐 Network..." -ForegroundColor Cyan
$networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^dnd-network$" -Quiet
if (-not $networkExists) {
    podman network create dnd-network
    Test-LastCommand "Creazione network fallita"
}
Write-Host "   ✅ Network dnd-network" -ForegroundColor Green

# STEP 4: Avvio MongoDB
Show-Progress "Avvio MongoDB" 4 6
$mongoExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^dnd-mongodb$" -Quiet
if ($mongoExists) {
    podman stop dnd-mongodb 2>$null
    podman rm dnd-mongodb 2>$null
}

podman run -d `
    --name dnd-mongodb `
    --network dnd-network `
    -p 27017:27017 `
    -e MONGO_INITDB_ROOT_USERNAME=admin `
    -e MONGO_INITDB_ROOT_PASSWORD=changeme123 `
    -e MONGO_INITDB_DATABASE=dnd `
    -v ${PWD}/data/mongodb:/data/db:Z `
    docker.io/library/mongo:6

Test-LastCommand "Avvio MongoDB fallito"
Write-Host "✅ MongoDB avviato" -ForegroundColor Green
Write-Host "   Attendo inizializzazione..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# STEP 5: Avvio Redis
Show-Progress "Avvio Redis" 5 6
$redisExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^dnd-redis$" -Quiet
if ($redisExists) {
    podman stop dnd-redis 2>$null
    podman rm dnd-redis 2>$null
}

podman run -d `
    --name dnd-redis `
    --network dnd-network `
    -p 6379:6379 `
    -v ${PWD}/data/redis:/data:Z `
    docker.io/library/redis:7-alpine redis-server --appendonly yes

Test-LastCommand "Avvio Redis fallito"
Write-Host "✅ Redis avviato" -ForegroundColor Green

# STEP 6: Avvio Backend
Show-Progress "Avvio Backend" 6 6
$backendExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^dnd-backend$" -Quiet
if ($backendExists) {
    podman stop dnd-backend 2>$null
    podman rm dnd-backend 2>$null
}

podman run -d `
    --name dnd-backend `
    --network dnd-network `
    -p 3000:3000 `
    -e NODE_ENV=production `
    -e PORT=3000 `
    -e DATABASE_URL=mongodb://admin:changeme123@dnd-mongodb:27017/dnd?authSource=admin `
    -e JWT_SECRET=your-super-secret-jwt-key-change-in-production `
    -e JWT_EXPIRES_IN=15m `
    -e REFRESH_TOKEN_EXPIRES_IN=7d `
    -e REDIS_URL=redis://dnd-redis:6379 `
    -e CORS_ORIGIN=http://localhost `
    localhost/dnd-backend:latest

Test-LastCommand "Avvio Backend fallito"
Write-Host "✅ Backend avviato" -ForegroundColor Green
Write-Host "   Attendo inizializzazione..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Avvio Frontend
Write-Host "📦 Frontend..." -ForegroundColor Cyan
$frontendExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^dnd-frontend$" -Quiet
if ($frontendExists) {
    podman stop dnd-frontend 2>$null
    podman rm dnd-frontend 2>$null
}

podman run -d `
    --name dnd-frontend `
    --network dnd-network `
    -p 8080:8080 `
    localhost/dnd-frontend:latest

Test-LastCommand "Avvio Frontend fallito"
Write-Host "   ✅ Frontend" -ForegroundColor Green

# Avvio Nginx
Write-Host "📦 Nginx..." -ForegroundColor Cyan
$nginxExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^dnd-nginx$" -Quiet
if ($nginxExists) {
    podman stop dnd-nginx 2>$null
    podman rm dnd-nginx 2>$null
}

podman run -d `
    --name dnd-nginx `
    --network dnd-network `
    -p 80:80 `
    localhost/dnd-nginx:latest

Test-LastCommand "Avvio Nginx fallito"
Write-Host "   ✅ Nginx" -ForegroundColor Green

# SUCCESS
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 Setup Completato! 🎉                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Applicazione disponibile:" -ForegroundColor Cyan
Write-Host "   http://localhost" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 Container attivi:" -ForegroundColor Cyan
podman ps --format "table {{.Names}}\t{{.Status}}"
Write-Host ""

Write-Host "🔧 Comandi utili:" -ForegroundColor Cyan
Write-Host "   Verifica:  " -NoNewline; Write-Host ".\podman-setup.ps1 -Check" -ForegroundColor Yellow
Write-Host "   Ferma:     " -NoNewline; Write-Host ".\podman-setup.ps1 -Stop" -ForegroundColor Yellow
Write-Host "   Pulisci:   " -NoNewline; Write-Host ".\podman-setup.ps1 -Clean" -ForegroundColor Yellow
Write-Host "   Logs:      " -NoNewline; Write-Host "podman logs -f dnd-backend" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Aprire il browser? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Start-Process "http://localhost"
}

Write-Host ""
Write-Host "Buon gioco! 🎲" -ForegroundColor Green

# Made with Bob
