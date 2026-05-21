#!/usr/bin/env pwsh
# Script completo per setup e avvio con Podman usando container singoli
# D&D Character Sheet Application

# Parametri DEVONO essere la prima cosa nello script
param(
    [switch]$Stop,
    [switch]$Check,
    [switch]$Clean
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     D&D Character Sheet - Setup Podman" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Funzione per gestire errori
function Test-LastCommand {
    param([string]$ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRORE] $ErrorMessage" -ForegroundColor Red
        exit 1
    }
}

# Funzione per mostrare progress
function Show-Progress {
    param([string]$Message, [int]$Step, [int]$Total)
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor Yellow
    Write-Host ("=" * 60) -ForegroundColor Gray
}

# STOP: Ferma tutti i container
if ($Stop) {
    Write-Host "[STOP] Arresto container..." -ForegroundColor Yellow
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
    Write-Host "[OK] Container fermati!" -ForegroundColor Green
    
    $response = Read-Host "Vuoi rimuovere anche i dati? (s/n)"
    if ($response -eq "s" -or $response -eq "S") {
        if (Test-Path ".\data") {
            Remove-Item -Recurse -Force ".\data"
            Write-Host "[OK] Dati rimossi!" -ForegroundColor Green
        }
    }
    exit 0
}

# CHECK: Verifica stato
if ($Check) {
    Write-Host "[CHECK] Verifica stato sistema..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verifica Podman
    Write-Host "1. Podman:" -ForegroundColor Cyan
    podman --version
    Write-Host ""
    
    # Verifica Network
    Write-Host "2. Network:" -ForegroundColor Cyan
    $networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^dnd-network$" -Quiet
    if ($networkExists) {
        Write-Host "   [OK] dnd-network presente" -ForegroundColor Green
    } else {
        Write-Host "   [X] dnd-network mancante" -ForegroundColor Red
    }
    Write-Host ""
    
    # Verifica Container
    Write-Host "3. Container:" -ForegroundColor Cyan
    podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
    
    # Verifica Immagini
    Write-Host "4. Immagini:" -ForegroundColor Cyan
    podman images | Select-String "dnd-"
    Write-Host ""
    
    # Test connettivita
    Write-Host "5. Test Servizi:" -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "   [OK] Backend API - OK" -ForegroundColor Green
    } catch {
        Write-Host "   [X] Backend API - Non risponde" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "   [OK] Frontend - OK" -ForegroundColor Green
    } catch {
        Write-Host "   [X] Frontend - Non risponde" -ForegroundColor Red
    }
    
    exit 0
}

# CLEAN: Pulizia completa
if ($Clean) {
    Write-Host "[CLEAN] Pulizia completa..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[!] ATTENZIONE: Questo rimuovera:" -ForegroundColor Red
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
        
        Write-Host "[OK] Pulizia completata!" -ForegroundColor Green
    } else {
        Write-Host "[X] Operazione annullata" -ForegroundColor Yellow
    }
    exit 0
}

# SETUP E AVVIO NORMALE
Write-Host "[START] Avvio setup completo..." -ForegroundColor Cyan
Write-Host ""

# STEP 1: Verifica Podman
Show-Progress "Verifica Podman" 1 6
podman --version
Test-LastCommand "Podman non installato. Scarica da: https://podman-desktop.io/"

# Verifica Podman machine
Write-Host "[CHECK] Verifica Podman machine..." -ForegroundColor Cyan
$machineStatus = podman machine list --format "{{.Running}}" 2>$null
if ($machineStatus -ne "true") {
    Write-Host "[!] Podman machine non in esecuzione" -ForegroundColor Yellow
    Write-Host "[INFO] Avvio Podman machine..." -ForegroundColor Cyan
    
    # Verifica se esiste una machine
    $machineExists = podman machine list --format "{{.Name}}" 2>$null
    if (-not $machineExists) {
        Write-Host "[INFO] Creazione Podman machine..." -ForegroundColor Cyan
        podman machine init
        Test-LastCommand "Creazione Podman machine fallita"
    }
    
    Write-Host "[INFO] Avvio Podman machine (puo richiedere 1-2 minuti)..." -ForegroundColor Cyan
    podman machine start
    Test-LastCommand "Avvio Podman machine fallito"
    
    Write-Host "[OK] Podman machine avviata" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

Write-Host "[OK] Podman OK" -ForegroundColor Green

# STEP 2: Build immagini
Show-Progress "Build immagini (5-10 minuti)" 2 6

Write-Host "[BUILD] Backend..." -ForegroundColor Cyan
Set-Location backend
podman build -t localhost/dnd-backend:latest -f Containerfile .
Test-LastCommand "Build backend fallita"
Set-Location ..
Write-Host "   [OK] Backend" -ForegroundColor Green

Write-Host "[BUILD] Frontend..." -ForegroundColor Cyan
Set-Location frontend
podman build -t localhost/dnd-frontend:latest -f Containerfile `
    --build-arg VITE_API_URL=http://localhost:3000 `
    --build-arg VITE_WS_URL=http://localhost:3000 .
Test-LastCommand "Build frontend fallita"
Set-Location ..
Write-Host "   [OK] Frontend" -ForegroundColor Green

Write-Host "[BUILD] Nginx..." -ForegroundColor Cyan
Set-Location nginx
podman build -t localhost/dnd-nginx:latest -f Containerfile .
Test-LastCommand "Build nginx fallita"
Set-Location ..
Write-Host "   [OK] Nginx" -ForegroundColor Green

# STEP 3: Preparazione
Show-Progress "Preparazione ambiente" 3 6

# Crea volumi Podman
Write-Host "[SETUP] Volumi Podman..." -ForegroundColor Cyan
$mongoVolumeExists = podman volume ls --format "{{.Name}}" | Select-String -Pattern "^dnd-mongodb-data$" -Quiet
if (-not $mongoVolumeExists) {
    podman volume create dnd-mongodb-data | Out-Null
}
$redisVolumeExists = podman volume ls --format "{{.Name}}" | Select-String -Pattern "^dnd-redis-data$" -Quiet
if (-not $redisVolumeExists) {
    podman volume create dnd-redis-data | Out-Null
}
Write-Host "   [OK] Volumi creati" -ForegroundColor Green

# Crea network
Write-Host "[SETUP] Network..." -ForegroundColor Cyan
$networkExists = podman network ls --format "{{.Name}}" | Select-String -Pattern "^dnd-network$" -Quiet
if (-not $networkExists) {
    podman network create dnd-network
    Test-LastCommand "Creazione network fallita"
}
Write-Host "   [OK] Network dnd-network" -ForegroundColor Green

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
    -v dnd-mongodb-data:/data/db `
    docker.io/library/mongo:6

Test-LastCommand "Avvio MongoDB fallito"
Write-Host "[OK] MongoDB avviato" -ForegroundColor Green
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
    -v dnd-redis-data:/data `
    docker.io/library/redis:7-alpine redis-server --appendonly yes

Test-LastCommand "Avvio Redis fallito"
Write-Host "[OK] Redis avviato" -ForegroundColor Green

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
Write-Host "[OK] Backend avviato" -ForegroundColor Green
Write-Host "   Attendo inizializzazione..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Avvio Frontend
Write-Host "[START] Frontend..." -ForegroundColor Cyan
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
Write-Host "   [OK] Frontend" -ForegroundColor Green

# Attendi che backend sia pronto prima di avviare Nginx
Write-Host "[WAIT] Attendo che backend sia pronto..." -ForegroundColor Cyan
$maxRetries = 30
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "   [OK] Backend pronto!" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "   Tentativo $retryCount/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "[!] Backend non risponde, ma continuo..." -ForegroundColor Yellow
}

# Avvio Nginx
Write-Host "[START] Nginx..." -ForegroundColor Cyan
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
Write-Host "   [OK] Nginx" -ForegroundColor Green

# SUCCESS
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "              Setup Completato con Successo!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "[INFO] Applicazione disponibile:" -ForegroundColor Cyan
Write-Host "   http://localhost" -ForegroundColor Yellow
Write-Host ""

Write-Host "[INFO] Container attivi:" -ForegroundColor Cyan
podman ps --format "table {{.Names}}\t{{.Status}}"
Write-Host ""

Write-Host "[INFO] Comandi utili:" -ForegroundColor Cyan
Write-Host "   Verifica:  .\podman-setup.ps1 -Check" -ForegroundColor White
Write-Host "   Ferma:     .\podman-setup.ps1 -Stop" -ForegroundColor White
Write-Host "   Pulisci:   .\podman-setup.ps1 -Clean" -ForegroundColor White
Write-Host "   Logs:      podman logs -f dnd-backend" -ForegroundColor White
Write-Host ""

$response = Read-Host "Aprire il browser? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Start-Process "http://localhost"
}

Write-Host ""
Write-Host "Buon gioco!" -ForegroundColor Green

# Made with Bob
