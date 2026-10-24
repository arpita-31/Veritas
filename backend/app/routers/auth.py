from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, TokenResponse, UserProfile
from ..security.auth_handler import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Preconfigured demo personas
DEMO_PERSONAS = [
    {
        "username": "vcet_admin",
        "displayName": "VCET Mumbai — Institution Administrator",
        "role": "admin",
        "institutionId": "vcet-mumbai",
        "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "description": "Can authorize and suspend VCET issuers and manage institution-level operations."
    },
    {
        "username": "vcet_issuer",
        "displayName": "VCET Mumbai — Authorized Academic Registrar",
        "role": "issuer",
        "institutionId": "vcet-mumbai",
        "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "description": "Authorized key that signs and commits credentials to the EVM registry."
    },
    {
        "username": "partner_admin",
        "displayName": "Partner University — Administrator",
        "role": "admin",
        "institutionId": "partner-univ",
        "walletAddress": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "description": "Controls partner university issuer identities and records."
    },
    {
        "username": "partner_issuer",
        "displayName": "Partner University — Authorized Issuer",
        "role": "issuer",
        "institutionId": "partner-univ",
        "walletAddress": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "description": "Authorized issuer for Partner University credentials."
    },
    {
        "username": "verifier_org",
        "displayName": "Global Verifier / Employer / Scholarship Org",
        "role": "verifier",
        "institutionId": None,
        "walletAddress": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        "description": "Independent receiving organization checking credentials without issuer database access."
    },
    {
        "username": "unauthorized_actor",
        "displayName": "Unauthorized Test Actor (Trust Sandbox)",
        "role": "unauthorized",
        "institutionId": "vcet-mumbai",
        "walletAddress": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "description": "Used in adversarial testing to prove unauthorized actions are rejected."
    }
]

@router.get("/demo-personas")
def get_demo_personas():
    """Returns list of development personas for quick testing in the UI."""
    return DEMO_PERSONAS

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "institution_id": user.institution_id,
            "wallet_address": user.wallet_address
        }
    }

@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
