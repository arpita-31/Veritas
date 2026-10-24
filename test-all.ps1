# VERITAS - Full Automated Test Suite Execution Script
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         VERITAS Full Automated Test Suite          " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Smart Contract Tests
Write-Host "`n[1/3] Running Hardhat Smart Contract Tests..." -ForegroundColor Yellow
Set-Location contracts
npx hardhat test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Contract tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 2. Backend Unit and Acceptance Tests
Write-Host "`n[2/3] Running Backend Cryptography and Acceptance Tests..." -ForegroundColor Yellow
Set-Location backend
python -m pytest tests/ -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

# 3. Frontend Production Build
Write-Host "`n[3/3] Testing React TypeScript Production Build..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Set-Location ..

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "   ALL VERITAS CONTRACT, BACKEND & FRONTEND TESTS PASSED! " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
