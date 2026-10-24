import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from web3 import Web3
from ..database import get_db
from ..models import Issuer, Institution, User, AuditRecord
from ..schemas import IssuerResponse, IssuerAuthorizeRequest, IssuerSuspendRequest
from ..security.auth_handler import get_current_user
from ..services.blockchain_service import blockchain_service
from ..services.canonicalization import compute_identifier_hash
from ..config import settings

router = APIRouter(prefix="/issuers", tags=["Issuers"])

@router.get("", response_model=List[IssuerResponse])
def list_issuers(institution_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Issuer)
    if institution_id:
        query = query.filter(Issuer.institution_id == institution_id)
    issuers = query.all()

    # Sync live on-chain status
    results = []
    for iss in issuers:
        is_auth = iss.is_authorized
        if blockchain_service.is_connected():
            try:
                is_auth = blockchain_service.is_issuer_authorized(iss.institution_id, iss.wallet_address)
            except Exception:
                pass

        results.append(IssuerResponse(
            id=iss.id,
            wallet_address=iss.wallet_address,
            institution_id=iss.institution_id,
            is_authorized=is_auth,
            authorized_at=iss.authorized_at.isoformat() if iss.authorized_at else None,
            suspended_at=iss.suspended_at.isoformat() if iss.suspended_at else None,
            label=iss.label
        ))
    return results

@router.post("/authorize", response_model=IssuerResponse)
def authorize_issuer(
    req: IssuerAuthorizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authorizes an issuer for an institution.
    Enforces that only the designated institution admin can authorize.
    """
    inst = db.query(Institution).filter(Institution.institution_id == req.institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    # Cross-institution authorization protection!
    admin_wallet = current_user.wallet_address
    is_admin = admin_wallet and (admin_wallet.lower() == inst.admin_address.lower())
    is_gov = (current_user.role == "governance")

    if not (is_admin or is_gov):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-institution violation: Wallet {admin_wallet} cannot manage issuers for '{req.institution_id}'."
        )

    # On-chain authorization call
    tx_hash = None
    if blockchain_service.is_connected() and blockchain_service.contract:
        admin_private_key = settings.DEV_PRIVATE_KEYS.get(admin_wallet)
        if admin_private_key:
            try:
                w3 = blockchain_service.w3
                inst_hash = bytes.fromhex(compute_identifier_hash(req.institution_id)[2:])
                target_issuer = Web3.to_checksum_address(req.issuer_address)
                nonce = w3.eth.get_transaction_count(admin_wallet, "pending")
                tx = blockchain_service.contract.functions.authorizeIssuer(
                    inst_hash,
                    target_issuer
                ).build_transaction({
                    "from": admin_wallet,
                    "nonce": nonce,
                    "gas": 200000,
                    "gasPrice": w3.eth.gas_price,
                    "chainId": w3.eth.chain_id
                })
                signed = w3.eth.account.sign_transaction(tx, admin_private_key)
                send_tx = w3.eth.send_raw_transaction(signed.raw_transaction)
                rcpt = w3.eth.wait_for_transaction_receipt(send_tx, timeout=20)
                tx_hash = send_tx.hex()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Smart contract transaction failed during issuer authorization: {str(e)}"
                )

    # Update or insert in DB
    issuer = db.query(Issuer).filter(
        Issuer.institution_id == req.institution_id,
        Issuer.wallet_address == req.issuer_address
    ).first()

    now = datetime.datetime.utcnow()
    if not issuer:
        issuer = Issuer(
            wallet_address=req.issuer_address,
            institution_id=req.institution_id,
            is_authorized=True,
            authorized_at=now,
            authorized_tx=tx_hash,
            label=req.label or f"{req.institution_id} Authorized Signer"
        )
        db.add(issuer)
    else:
        issuer.is_authorized = True
        issuer.authorized_at = now
        issuer.suspended_at = None
        if tx_hash:
            issuer.authorized_tx = tx_hash
        if req.label:
            issuer.label = req.label

    # Off-chain audit record
    db.add(AuditRecord(
        event_type="IssuerAuthorized",
        source="blockchain" if tx_hash else "offchain",
        actor_address=admin_wallet,
        institution_id=req.institution_id,
        tx_hash=tx_hash,
        details_json=f'{{"issuer": "{req.issuer_address}", "label": "{req.label}"}}'
    ))

    db.commit()
    db.refresh(issuer)

    return IssuerResponse(
        id=issuer.id,
        wallet_address=issuer.wallet_address,
        institution_id=issuer.institution_id,
        is_authorized=True,
        authorized_at=issuer.authorized_at.isoformat() if issuer.authorized_at else None,
        suspended_at=None,
        label=issuer.label
    )

@router.post("/suspend", response_model=IssuerResponse)
def suspend_issuer(
    req: IssuerSuspendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.institution_id == req.institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    admin_wallet = current_user.wallet_address
    is_admin = admin_wallet and (admin_wallet.lower() == inst.admin_address.lower())
    is_gov = (current_user.role == "governance")

    if not (is_admin or is_gov):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-institution violation: Cannot suspend issuer for '{req.institution_id}'."
        )

    # On-chain suspension call
    tx_hash = None
    if blockchain_service.is_connected() and blockchain_service.contract:
        admin_private_key = settings.DEV_PRIVATE_KEYS.get(admin_wallet)
        if admin_private_key:
            try:
                w3 = blockchain_service.w3
                inst_hash = bytes.fromhex(compute_identifier_hash(req.institution_id)[2:])
                target_issuer = Web3.to_checksum_address(req.issuer_address)
                nonce = w3.eth.get_transaction_count(admin_wallet, "pending")
                tx = blockchain_service.contract.functions.suspendIssuer(
                    inst_hash,
                    target_issuer
                ).build_transaction({
                    "from": admin_wallet,
                    "nonce": nonce,
                    "gas": 200000,
                    "gasPrice": w3.eth.gas_price,
                    "chainId": w3.eth.chain_id
                })
                signed = w3.eth.account.sign_transaction(tx, admin_private_key)
                send_tx = w3.eth.send_raw_transaction(signed.raw_transaction)
                rcpt = w3.eth.wait_for_transaction_receipt(send_tx, timeout=20)
                tx_hash = send_tx.hex()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Smart contract transaction failed during issuer suspension: {str(e)}"
                )

    issuer = db.query(Issuer).filter(
        Issuer.institution_id == req.institution_id,
        Issuer.wallet_address == req.issuer_address
    ).first()

    if not issuer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issuer not found")

    now = datetime.datetime.utcnow()
    issuer.is_authorized = False
    issuer.suspended_at = now

    db.add(AuditRecord(
        event_type="IssuerSuspended",
        source="blockchain" if tx_hash else "offchain",
        actor_address=admin_wallet,
        institution_id=req.institution_id,
        tx_hash=tx_hash,
        details_json=f'{{"issuer": "{req.issuer_address}"}}'
    ))

    db.commit()
    db.refresh(issuer)

    return IssuerResponse(
        id=issuer.id,
        wallet_address=issuer.wallet_address,
        institution_id=issuer.institution_id,
        is_authorized=False,
        authorized_at=issuer.authorized_at.isoformat() if issuer.authorized_at else None,
        suspended_at=issuer.suspended_at.isoformat() if issuer.suspended_at else None,
        label=issuer.label
    )
