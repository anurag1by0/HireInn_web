---
description: Start the HireInn application stack
---

# Start HireInn Application

This workflow starts both the backend API and the frontend application.

## 1. Start Backend

Open a new terminal and run:

```powershell
cd backend
python -m uvicorn app.api.main:app --reload
```

## 2. Start Frontend

Open another terminal and run:

```powershell
cd one-click-jobs
npm run dev
```

## 3. Verify Scraper (Dry Run)

To verify the scraper works:

```powershell
cd backend
python -m app.scraper.dry_run
```

## 4. Run Continuous Scraper

To run the scraper continuously:

```powershell
cd backend
python -m app.scraper.run_continuous
```
