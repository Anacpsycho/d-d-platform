#!/usr/bin/env pwsh
# Script per ricostruire package-lock.json puliti

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     Ricostruzione package-lock.json" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "[1/2] Backend..." -ForegroundColor Yellow
Set-Location backend

if (Test-Path "node_modules") {
    Write-Host "   Rimuovo node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "package-lock.json") {
    Write-Host "   Rimuovo package-lock.json vecchio..." -ForegroundColor Gray
    Remove-Item package-lock.json
}

Write-Host "   Installo dipendenze..." -ForegroundColor Gray
npm install

Write-Host "   [OK] Backend" -ForegroundColor Green
Set-Location ..

# Frontend
Write-Host ""
Write-Host "[2/2] Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "node_modules") {
    Write-Host "   Rimuovo node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "package-lock.json") {
    Write-Host "   Rimuovo package-lock.json vecchio..." -ForegroundColor Gray
    Remove-Item package-lock.json
}

Write-Host "   Installo dipendenze..." -ForegroundColor Gray
npm install

Write-Host "   [OK] Frontend" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "     Ricostruzione completata!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nuovi package-lock.json creati con versioni aggiornate" -ForegroundColor Cyan
Write-Host ""

# Made with Bob