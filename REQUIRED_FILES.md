REQUIRED FILES — ZYNK-FINAL

Purpose
- This file lists the minimal, required files and folders for developers to run and understand the project. It also gives an ordered, user-friendly layout.
- Non-essential files can be moved into an `archive/` folder (commands provided below) if you want a cleaner top-level.

Top-level (required)
- [README.md](README.md) — Project overview and instructions.
- [backend/](backend/) — Backend service (required to run API).
- [zynk-bites-main/](zynk-bites-main/) — Frontend app (Vite + React).

Backend (ordered)
1. [backend/package.json](backend/package.json) — Backend dependencies and scripts.
2. [backend/tsconfig.json](backend/tsconfig.json) — TypeScript configuration.
3. [backend/drizzle.config.ts](backend/drizzle.config.ts) — DB config/migrations.
4. [backend/src/index.ts](backend/src/index.ts) — Backend entry point.
5. [backend/src/config/](backend/src/config/) — Database/config helpers.
6. [backend/src/controllers/](backend/src/controllers/) — Route controllers (`authController.ts`, `subscriptionController.ts`).
7. [backend/src/routes/](backend/src/routes/) — Route definitions (`authRoutes.ts`, `subscriptionRoutes.ts`).
8. [backend/src/middlewares/](backend/src/middlewares/) — `auth.ts`, `authorize.ts`, `errorHandler.ts`, `validation.ts`.
9. [backend/src/models/](backend/src/models/) — DB schema and query helpers.
10. [backend/README.md](backend/README.md) and [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) — Backend docs.

Frontend (ordered)
1. [zynk-bites-main/package.json](zynk-bites-main/package.json) — Frontend dependencies and scripts.
2. [zynk-bites-main/vite.config.ts](zynk-bites-main/vite.config.ts) — Build/dev config.
3. [zynk-bites-main/src/main.tsx](zynk-bites-main/src/main.tsx) — Frontend entry point.
4. [zynk-bites-main/src/pages/](zynk-bites-main/src/pages/) — Public pages (`Index`, `Login`, `Register`, etc.).
5. [zynk-bites-main/src/components/](zynk-bites-main/src/components/) — Reusable UI components and dashboards.
6. [zynk-bites-main/src/services/](zynk-bites-main/src/services/) — API client and DB helpers.
7. [zynk-bites-main/README.md](zynk-bites-main/README.md) — Frontend docs.

Optional / developer helpers (keep if actively used)
- Root `TESTING_*` and `BACKEND_COMPLETE.md` files if they document important tests or completion notes.

Suggested cleanup (commands)
- To move all non-required top-level files into an `archive/` directory (preview then run):

PowerShell preview (dry-run):

```powershell
Push-Location 'C:\Users\sugab\Downloads\ZYNK-FINAL'
mkdir -Force archive
# Preview what would be moved (adjust the glob as needed)
Get-ChildItem -Path . -File | Where-Object { $_.Name -notin @('README.md') -and $_.Name -notin @('backend','zynk-bites-main') } | Select-Object Name
Pop-Location
```

PowerShell move (execute when ready):

```powershell
Push-Location 'C:\Users\sugab\Downloads\ZYNK-FINAL'
mkdir -Force archive
# Move non-required files/folders into archive (example, adjust list)
Move-Item .\TESTING_COMPLETE.md archive\ -Force
Move-Item .\BACKEND_COMPLETE.md archive\ -Force
Move-Item .\Downloads archive\ -Force
# Add/commit after verifying
git add -A
git commit -m "Move non-essential files to archive"
# Push to desired remote, for example origin
git push origin HEAD
Pop-Location
```

Notes
- I did not move or delete any files automatically. Run the commands above after reviewing the list.
- If you want, I can perform the archival and commit/push to `origin` or `upstream` (you choose). If `upstream` is used, ensure the remote URL is correct and you have permission.

If you'd like me to proceed and move non-required files into `archive/` and commit, reply with: `yes, archive` and indicate which remote to push to (`origin` or `upstream`).
