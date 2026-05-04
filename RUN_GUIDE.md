# Intake Prototype Run Guide

This project has two parts:

- Frontend: React + Vite
- Backend: Python + FastAPI

## 1. Install Frontend Dependencies

From the project root:

```powershell
cd C:\Users\Walid\OneDrive\Documents\GitHub\Intake-Prototype
npm install
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
```

## 2. Run The Frontend

From the project root:

```powershell
npm run dev
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

## 3. Install Backend Requirements

Go to the backend folder:

```powershell
cd C:\Users\Walid\OneDrive\Documents\GitHub\Intake-Prototype\backend
```

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If activation is blocked, skip activation and install requirements with the venv Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If activation worked, install requirements:

```powershell
pip install -r requirements.txt
```

## 4. Run The Backend

From the `backend` folder, with the virtual environment activated:

```powershell
uvicorn app.main:app --reload --port 8000
```

Or without activating:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open the backend health check:

```text
http://127.0.0.1:8000/health
```

You should see:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

## 5. Run Backend Tests

From the `backend` folder:

```powershell
.\.venv\Scripts\python.exe -m pytest tests
```

Expected result:

```text
1 passed
```

## Common Dev Setup

Use two terminals.

Terminal 1, frontend:

```powershell
cd C:\Users\Walid\OneDrive\Documents\GitHub\Intake-Prototype
npm.cmd run dev
```

Terminal 2, backend:

```powershell
cd C:\Users\Walid\OneDrive\Documents\GitHub\Intake-Prototype\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
