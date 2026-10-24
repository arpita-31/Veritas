import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False) # "governance", "admin", "issuer", "verifier", "unauthorized"
    institution_id = Column(String(64), nullable=True) # e.g. "vcet-mumbai"
    wallet_address = Column(String(42), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(String(64), unique=True, index=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    institution_type = Column(String(64), default="Higher Education")
    id_hash = Column(String(66), unique=True, nullable=False)
    admin_address = Column(String(42), nullable=False)
    is_active = Column(Boolean, default=True)
    registration_tx = Column(String(66), nullable=True)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

class Issuer(Base):
    __tablename__ = "issuers"

    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(42), index=True, nullable=False)
    institution_id = Column(String(64), index=True, nullable=False)
    is_authorized = Column(Boolean, default=True)
    authorized_at = Column(DateTime, default=datetime.datetime.utcnow)
    suspended_at = Column(DateTime, nullable=True)
    authorized_tx = Column(String(66), nullable=True)
    label = Column(String(120), nullable=True) # e.g. "VCET Academic Registrar Signing Key"

class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    credential_id = Column(String(128), unique=True, index=True, nullable=False) # e.g. "urn:uuid:..."
    credential_type = Column(String(64), index=True, nullable=False) # "AcademicCertificate", etc.
    institution_id = Column(String(64), index=True, nullable=False)
    issuer_address = Column(String(42), nullable=False)
    full_credential_json = Column(Text, nullable=False) # stored strictly off-chain!
    record_hash = Column(String(66), index=True, nullable=False)
    credential_id_hash = Column(String(66), unique=True, index=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(String(42), nullable=True)
    revocation_reason = Column(String(128), nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    credential_id = Column(String(128), index=True, nullable=True)
    overall_outcome = Column(String(32), nullable=False) # "VERIFIED", "TAMPERED", "REVOKED", "UNAUTHORIZED_ISSUER", "UNKNOWN", etc.
    checks_json = Column(Text, nullable=False) # JSON array/dict of all individual checks
    verifier_identity = Column(String(64), nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    error_details = Column(Text, nullable=True)

class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), index=True, nullable=False)
    source = Column(String(16), default="offchain") # "blockchain" or "offchain"
    actor_address = Column(String(42), nullable=True)
    institution_id = Column(String(64), nullable=True)
    credential_id = Column(String(128), nullable=True)
    tx_hash = Column(String(66), nullable=True)
    block_number = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
