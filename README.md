# Construction CRM

Python 3.11+, FastAPI, SQLModel, PostgreSQL, Alembic va Docker Compose.

## Ishga tushirish

1. `python scripts/init_env.py` root `.env` faylini zarur bo‘lsa yaratadi yoki yetishmayotgan sozlamalarni qo‘shadi; mavjud qiymatlarni saqlaydi.
2. Development rejimi: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`.
3. API `http://localhost:8001`, Swagger UI `http://localhost:8001/docs` manzillarida. PostgreSQL porti development rejimida faqat localhost’dan ochiladi.

VPS deploy uchun [docker-compose.prod.yml](docker-compose.prod.yml) alohida production konfiguratsiyasidir. U DB migratsiyasini bir martalik servisda bajarib, API’ni faqat broker tanlagan loopback portida ochadi. Serverdagi Nginx/DNS yo‘naltirishini `server-deploy` broker orqali alohida sozlaydi; domen tasdiqlanmagan bo‘lsa, API ommaga ochilmaydi.

Yangi o‘rnatishda PostgreSQL alohida migration va runtime rollarini yaratadi: schema o‘zgarishlari migration roli bilan, API so‘rovlari cheklangan runtime roli bilan bajariladi. Mavjud `.env` yangilansa, `init_env.py` eski DB nomi va rolini saqlab, yangi rol qiymatlarini avtomatik qo‘shmaydi; shu tariqa avvalgi `postgres_data` hajmi bilan ulanish uzilmaydi. Database `postgres_data` volume’da saqlanadi. `docker compose down -v` shu ma’lumotlarni ham o‘chiradi.

## Buyruqlar

- `make init-env` — root `.env` ni faqat yo‘q bo‘lsa yaratadi.
- `make dev` — API va PostgreSQL’ni development rejimida build qilib ishga tushiradi.
- `make test` — backend testlarini ishga tushiradi.
- `make lint` — Ruff tekshiruvini bajaradi.
- `make bootstrap` — birinchi kompaniya administratori uchun interaktiv CLI.
- `make backup` — PostgreSQL custom-format backup yaratadi.

Python buyruqlarini `backend/` ichidan bajaring. Masalan, migration holati: `uv run alembic current`; migration qo‘llash: `uv run alembic upgrade head`.

## GitHub deploy workflow

`.github/workflows/deploy.yml` `main` ga push va PR’da testlar hamda Docker image build’ini tekshiradi. Production deploy alohida `workflow_dispatch` orqali, `deploy=true` tanlanganda va project-scoped `sdp` SSH kaliti sozlangandagina ishlaydi. Bir martalik server deploy uchun o‘rnatilgan `server-deploy` skillidan foydalaning.

GitHub deploy secretlari: `SDP_SSH_KEY`, `SDP_KNOWN_HOSTS`, `SDP_HOST`, `SDP_USER`, `SDP_PORT`. Ular `sdp ci-key` va `sdp host-keys` orqali olinadigan, faqat shu loyiha broker buyruqlarini bajaradigan kirish bo‘lishi kerak.

Ma’lumotli mavjud DB ustida qayta seed ishlatmang. Barcha 5 ta mavjud Alembic revision saqlangan; `80bd820ae9c1` tarixiy no-op revision bo‘lgani uchun olib tashlanmadi.
