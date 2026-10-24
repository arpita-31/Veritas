#!/usr/bin/env bash
set -e

echo "===================================================="
echo "         VERITAS Full Automated Test Suite          "
echo "===================================================="

echo ""
echo "[1/3] Running Hardhat Smart Contract Tests..."
cd contracts
npx hardhat test
cd ..

echo ""
echo "[2/3] Running Backend Cryptography and Acceptance Tests..."
cd backend
python -m pytest tests/ -v
cd ..

echo ""
echo "[3/3] Testing React TypeScript Production Build..."
cd frontend
npm run build
cd ..

echo ""
echo "===================================================="
echo "   ALL VERITAS CONTRACT, BACKEND & FRONTEND TESTS PASSED! "
echo "===================================================="
