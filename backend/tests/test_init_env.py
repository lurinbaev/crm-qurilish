import importlib.util
from pathlib import Path


def test_init_env_adds_missing_values_without_replacing_existing_ones(tmp_path, monkeypatch):
    repo = Path(__file__).resolve().parents[2]
    script = repo / "scripts" / "init_env.py"
    spec = importlib.util.spec_from_file_location("init_env", script)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    target = tmp_path / ".env"
    target.write_text(
        "DATABASE_URL=postgresql+psycopg://crm_owner:keep-db-password@localhost:5432/crm_course_v3\n"
        "JWT_SECRET=keep-this-value\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(module, "ENV_FILE", target)

    module.main()
    first = target.read_text(encoding="utf-8")
    module.main()

    assert "JWT_SECRET=keep-this-value" in first
    assert "POSTGRES_USER=crm_owner" in first
    assert "POSTGRES_PASSWORD=keep-db-password" in first
    assert "POSTGRES_DB=crm_course_v3" in first
    assert "APP_DB_PASSWORD=" not in first
    assert target.read_text(encoding="utf-8") == first


def test_init_env_creates_separate_roles_for_new_install(tmp_path, monkeypatch):
    repo = Path(__file__).resolve().parents[2]
    spec = importlib.util.spec_from_file_location("init_env_new", repo / "scripts" / "init_env.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    target = tmp_path / ".env"
    monkeypatch.setattr(module, "ENV_FILE", target)

    module.main()

    env = target.read_text(encoding="utf-8")
    assert "MIGRATION_DB_USER=crm_migrator" in env
    assert "APP_DB_USER=crm_app" in env
