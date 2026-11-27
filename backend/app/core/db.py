from collections.abc import AsyncIterator, Iterator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import Session, create_engine

from app.core.config import settings


@lru_cache
def engine():
    return create_engine(
        settings().database_url.get_secret_value(),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_timeout=5,
        connect_args={"connect_timeout": 5, "options": "-c statement_timeout=5000"},
    )


@lru_cache
def async_engine():
    """Async Psycopg engine for async endpoints; Psycopg is already a project dependency."""
    return create_async_engine(
        settings().database_url.get_secret_value(),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_timeout=5,
        connect_args={"connect_timeout": 5, "options": "-c statement_timeout=5000"},
    )


@lru_cache
def async_session_factory():
    return async_sessionmaker(async_engine(), expire_on_commit=False)


async def get_async_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


AsyncSessionDep = Annotated[AsyncSession, Depends(get_async_session)]


def get_session() -> Iterator[Session]:
    with Session(engine()) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
