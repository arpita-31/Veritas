from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, Issuer, Credential, VerificationLog
from ..schemas import DashboardMetrics
from ..services.blockchain_service import blockchain_service
from ..services.audit_service import audit_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_institutions = db.query(Institution).count()
    active_issuers = db.query(Issuer).filter(Issuer.is_authorized == True).count()
    credentials_issued = db.query(Credential).count()
    credentials_revoked = db.query(Credential).filter(Credential.is_revoked == True).count()

    total_verifications = db.query(VerificationLog).count()
    successful_verifications = db.query(VerificationLog).filter(VerificationLog.overall_outcome == "VERIFIED").count()
    failed_verifications = total_verifications - successful_verifications

    # Distribution of credential types
    creds = db.query(Credential.credential_type).all()
    type_counts = dict(Counter([c[0] for c in creds]))

    # Network status
    network_status = blockchain_service.get_network_info()

    # Recent activities (up to 8)
    recent_activity = audit_service.get_audit_trail(db=db)[:8]

    return DashboardMetrics(
        totalInstitutions=total_institutions,
        activeIssuers=active_issuers,
        credentialsIssued=credentials_issued,
        credentialsRevoked=credentials_revoked,
        totalVerifications=total_verifications,
        successfulVerifications=successful_verifications,
        failedVerifications=failed_verifications,
        networkStatus=network_status,
        credentialTypeDistribution=type_counts,
        recentActivity=recent_activity
    )
