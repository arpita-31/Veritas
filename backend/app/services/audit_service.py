import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import AuditRecord
from .blockchain_service import blockchain_service

class AuditService:
    @staticmethod
    def get_audit_trail(
        db: Session,
        event_type: Optional[str] = None,
        institution_id: Optional[str] = None,
        credential_id: Optional[str] = None,
        source: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        combined_logs = []

        # 1. Fetch on-chain events if requested
        if source != "offchain":
            chain_events = blockchain_service.fetch_all_events()
            for evt in chain_events:
                args = evt["args"]
                inst_match = True
                if institution_id:
                    # check in args
                    inst_match = (
                        args.get("institutionIdHash") == institution_id or
                        institution_id in str(args.get("institutionIdHash", ""))
                    )

                type_match = True
                if event_type and evt["eventType"] != event_type:
                    type_match = False

                if inst_match and type_match:
                    combined_logs.append({
                        "id": f"chain_{evt['txHash'][:10]}_{evt['blockNumber']}",
                        "source": "blockchain",
                        "eventType": evt["eventType"],
                        "txHash": evt["txHash"],
                        "blockNumber": evt["blockNumber"],
                        "actorAddress": args.get("issuer") or args.get("admin") or args.get("revokedBy") or args.get("authorizedBy"),
                        "institutionId": args.get("institutionIdHash"),
                        "credentialId": args.get("credentialIdHash"),
                        "details": args,
                        "timestamp": None # on-chain block timestamp
                    })

        # 2. Fetch off-chain records from database
        if source != "blockchain":
            query = db.query(AuditRecord)
            if event_type:
                query = query.filter(AuditRecord.event_type == event_type)
            if institution_id:
                query = query.filter(AuditRecord.institution_id == institution_id)
            if credential_id:
                query = query.filter(AuditRecord.credential_id == credential_id)

            offchain_records = query.order_by(AuditRecord.created_at.desc()).limit(100).all()
            for r in offchain_records:
                details_parsed = {}
                try:
                    if r.details_json:
                        details_parsed = json.loads(r.details_json)
                except Exception:
                    details_parsed = {"raw": r.details_json}

                combined_logs.append({
                    "id": f"offchain_{r.id}",
                    "source": r.source or "offchain",
                    "eventType": r.event_type,
                    "txHash": r.tx_hash,
                    "blockNumber": r.block_number,
                    "actorAddress": r.actor_address,
                    "institutionId": r.institution_id,
                    "credentialId": r.credential_id,
                    "details": details_parsed,
                    "timestamp": r.created_at.isoformat() + "Z" if r.created_at else None
                })

        return combined_logs

audit_service = AuditService()
