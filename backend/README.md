# Nilab Tattoos FastAPI Backend Skeleton

This is a minimal FastAPI scaffold for the intake prototype. It currently exposes only a health check while the backend data model and database plan are still being designed.

## Run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/docs` for the generated API docs.

## Test

```powershell
cd backend
pytest
```

## Current API Surface

- `GET /health`

## Next Steps

Add routes, schemas, persistence, auth, and upload handling once the production backend shape is chosen.
