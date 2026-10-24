# VERITAS - One-Click Launch Script for Windows PowerShell
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       Starting VERITAS Trust Infrastructure        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Start Hardhat EVM Node
Write-Host "`n[1/4] Starting local EVM Node on port 8545..." -ForegroundColor Yellow
$hardhatProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd contracts; npx hardhat node" -PassThru
Start-Sleep -Seconds 4

# 2. Deploy Smart Contracts & Bootstrap Seed
Write-Host "`n[2/4] Deploying InstitutionalTrustRegistry to localhost..." -ForegroundColor Yellow
Set-Location contracts
npx hardhat run scripts/deploy.js --network localhost
Set-Location ..

# 3. Start FastAPI Backend
Write-Host "`n[3/4] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru
Start-Sleep -Seconds 3

# 4. Start React Frontend
Write-Host "`n[4/4] Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "   VERITAS is running! Access via browser:         " -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173                  " -ForegroundColor White
Write-Host "   Backend API Docs: http://127.0.0.1:8000/docs     " -ForegroundColor White
Write-Host "   EVM RPC Node: http://127.0.0.1:8545              " -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Green
