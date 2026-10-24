from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, Issuer, User
from ..schemas import InstitutionResponse, InstitutionCreate
from ..security.auth_handler import get_current_user, require_roles
from ..services.blockchain_service import blockchain_service
from ..services.canonicalization import compute_identifier_hash

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionResponse])
def list_institutions(db: Session = Depends(get_db)):
    """List all registered institutions and sync status with on-chain registry."""
    insts = db.query(Institution).all()
    results = []
    for inst in insts:
        # Check on-chain active status if node available
        is_active = inst.is_active
        if blockchain_service.is_connected():
            try:
                chain_info = blockchain_service.get_institution(inst.institution_id)
                if chain_info.get("exists"):
                    is_active = chain_info["isActive"]
            except Exception:
                pass

        results.append(InstitutionResponse(
            id=inst.id,
            institution_id=inst.institution_id,
            display_name=inst.display_name,
            institution_type=inst.institution_type or "Higher Education",
            id_hash=inst.id_hash,
            admin_address=inst.admin_address,
            is_active=is_active,
            registration_tx=inst.registration_tx,
            registered_at=inst.registered_at.isoformat() if inst.registered_at else None
        ))
    return results

@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(institution_id: str, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.institution_id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
    return InstitutionResponse(
        id=inst.id,
        institution_id=inst.institution_id,
        display_name=inst.display_name,
        institution_type=inst.institution_type or "Higher Education",
        id_hash=inst.id_hash,
        admin_address=inst.admin_address,
        is_active=inst.is_active,
        registration_tx=inst.registration_tx,
        registered_at=inst.registered_at.isoformat() if inst.registered_at else None
    )

@router.post("", response_model=InstitutionResponse)
def register_institution(
    req: InstitutionCreate,
    current_user: User = Depends(require_roles(["governance"])),
    db: Session = Depends(get_db)
):
    """Registers a new institution (Registry Governance only)."""
    existing = db.query(Institution).filter(Institution.institution_id == req.institution_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Institution ID already registered")

    id_hash = compute_identifier_hash(req.institution_id)
    new_inst = Institution(
        institution_id=req.institution_id,
        display_name=req.display_name,
        institution_type=req.institution_type,
        id_hash=id_hash,
        admin_address=req.admin_address,
        is_active=True
    )
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)
    return InstitutionResponse(
        id=new_inst.id,
        institution_id=new_inst.institution_id,
        display_name=new_inst.display_name,
        institution_type=new_inst.institution_type,
        id_hash=new_inst.id_hash,
        admin_address=new_inst.admin_address,
        is_active=new_inst.is_active,
        registration_tx=new_inst.registration_tx,
        registered_at=new_inst.registered_at.isoformat() if new_inst.registered_at else None
    )
