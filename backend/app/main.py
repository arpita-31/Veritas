import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base, SessionLocal
from .routers import (
    auth,
    institutions,
    issuers,
    credentials,
    verification,
    audit,
    dashboard,
    trust_lab
)
from .seed_data import seed_database
from .services.blockchain_service import blockchain_service

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed default synthetic data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    blockchain_service.load_contract()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VERITAS - Verifiable Institutional Records and Trust Infrastructure for Authenticity, Traceability, and Auditability",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(institutions.router, prefix=settings.API_V1_PREFIX)
app.include_router(issuers.router, prefix=settings.API_V1_PREFIX)
app.include_router(credentials.router, prefix=settings.API_V1_PREFIX)
app.include_router(verification.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(trust_lab.router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
@app.get("/api/health")
def health_check():
    net_info = blockchain_service.get_network_info()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "blockchain": net_info
    }

@app.get("/")
def root():
    return {
        "project": "VERITAS",
        "tagline": "Trust the proof. Verify the source. Protect the data.",
        "documentation": "/docs",
        "apiPrefix": settings.API_V1_PREFIX
    }
