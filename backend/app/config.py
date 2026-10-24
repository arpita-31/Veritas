import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "VERITAS"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "veritas-super-secret-development-key-32chars-min!!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for demo

    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/veritas.db")

    # Blockchain
    RPC_URL: str = os.getenv("RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "31337"))

    # Contract deployment info path
    CONTRACT_INFO_PATH: str = os.getenv(
        "CONTRACT_INFO_PATH",
        str(BASE_DIR / "app" / "contract_info.json")
    )

    # Standard Hardhat dev accounts and private keys (Dev only)
    DEV_PRIVATE_KEYS: dict = {
        # Governance (Account #0)
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        # VCET Admin (Account #1)
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        # VCET Issuer (Account #2)
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        # Partner Admin (Account #3)
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        # Partner Issuer (Account #4)
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
        # Verifier (Account #5)
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
        # Unauthorized Test Actor (Account #6)
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d7b8d88b2b0b25b6ae"
    }

settings = Settings()
