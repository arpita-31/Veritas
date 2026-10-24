import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User, Institution, Issuer, AuditRecord
from .security.auth_handler import get_password_hash
from .services.canonicalization import compute_identifier_hash

def seed_database(db: Session):
    Base.metadata.create_all(bind=engine)

    if db.query(User).first():
        return

    default_password_hash = get_password_hash("password123")

    users_data = [
        {
            "username": "governance",
            "email": "governance@veritas.org",
            "role": "governance",
            "institution_id": None,
            "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        },
        {
            "username": "vcet_admin",
            "email": "admin@vcet.edu.in",
            "role": "admin",
            "institution_id": "vcet-mumbai",
            "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        },
        {
            "username": "vcet_issuer",
            "email": "registrar@vcet.edu.in",
            "role": "issuer",
            "institution_id": "vcet-mumbai",
            "wallet_address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        },
        {
            "username": "partner_admin",
            "email": "admin@partneruniv.edu",
            "role": "admin",
            "institution_id": "partner-univ",
            "wallet_address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        },
        {
            "username": "partner_issuer",
            "email": "registrar@partneruniv.edu",
            "role": "issuer",
            "institution_id": "partner-univ",
            "wallet_address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
        },
        {
            "username": "verifier_org",
            "email": "verifier@enterprise.org",
            "role": "verifier",
            "institution_id": None,
            "wallet_address": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
        },
        {
            "username": "unauthorized_actor",
            "email": "attacker@sandbox.test",
            "role": "unauthorized",
            "institution_id": "vcet-mumbai",
            "wallet_address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
        }
    ]

    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            hashed_password=default_password_hash,
            role=u["role"],
            institution_id=u["institution_id"],
            wallet_address=u["wallet_address"],
            is_active=True
        )
        db.add(user)

    inst_vcet = Institution(
        institution_id="vcet-mumbai",
        display_name="Vidyavardhini's College of Engineering and Technology",
        institution_type="Engineering & Technology University",
        id_hash=compute_identifier_hash("vcet-mumbai"),
        admin_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        is_active=True
    )
    inst_partner = Institution(
        institution_id="partner-univ",
        display_name="Partner Global University",
        institution_type="International Research University",
        id_hash=compute_identifier_hash("partner-univ"),
        admin_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        is_active=True
    )
    db.add(inst_vcet)
    db.add(inst_partner)

    iss_vcet = Issuer(
        wallet_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        institution_id="vcet-mumbai",
        is_authorized=True,
        authorized_at=datetime.datetime.utcnow(),
        label="VCET Academic Registrar Signing Key"
    )
    iss_partner = Issuer(
        wallet_address="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        institution_id="partner-univ",
        is_authorized=True,
        authorized_at=datetime.datetime.utcnow(),
        label="Partner Global Academic Records Key"
    )
    db.add(iss_vcet)
    db.add(iss_partner)

    db.add(AuditRecord(
        event_type="RegistryInitialized",
        source="offchain",
        actor_address="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        details_json='{"action": "Bootstrap governance and synthetic entities registered"}'
    ))

    db.commit()
