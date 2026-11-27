from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.db import async_engine, engine
from app.core.observability import install
from app.modules.auth.routes import router as auth_router
from app.modules.catalog.routes import router as catalog_router
from app.modules.inventory.routes import router as inventory_router
from app.modules.leads.routes import router as crm_router
from app.modules.public.routes import router


@asynccontextmanager
async def lifespan(app):
    yield
    engine().dispose()
    await async_engine().dispose()


app = FastAPI(title="Construction CRM", lifespan=lifespan)
app.include_router(router)
app.include_router(catalog_router)


@app.get("/health")
def health():
    return {"status": "ok"}
@app.get("/")
def root():
    return {"service": "Construction CRM", "docs": "/docs"}

@app.get("/ready")
def ready():
    try:
        with engine().connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(503, "Database unavailable") from None
    return {"status": "ready"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
install(app)
app.include_router(auth_router)
app.include_router(crm_router)
app.include_router(inventory_router)
