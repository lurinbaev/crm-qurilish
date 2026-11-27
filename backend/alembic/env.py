from alembic import context
from sqlmodel import SQLModel

from app.modules.users import models as user_models  # noqa: F401
from app.modules.catalog import models as catalog_models  # noqa: F401
from app.modules.leads import models as lead_models  # noqa: F401
from app.core.db import engine

target_metadata = SQLModel.metadata
with engine().connect() as connection:
    context.configure(
        connection=connection, target_metadata=target_metadata, compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()
