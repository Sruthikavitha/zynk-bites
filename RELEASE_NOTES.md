RELEASE v1.0 — ZYNK

Release Date: 2026-01-27
Commit: 75f02ed (HEAD -> master)

Live URLs
- Frontend: https://zynk-bites-production-1343.up.railway.app/  
- Backend API: https://zynk-bites-production-1343.up.railway.app/api  
(Note: Railway served both backend and frontend on same host in this deploy)

Summary
- Cleaned repository to keep only required files
- Connected frontend to real backend API
- Completed DB setup and applied Drizzle migrations
- Added production configs: Dockerfile, env templates, Railway + Vercel guides
- Added comprehensive testing, deployment, and status documentation

What to test
- Register a user via frontend and verify in DB
- Login and access profile
- Create subscription and verify persistence
- Check chef/customer dashboards

Contact
- Maintainer: Suga-bharathi (GitHub)
- Repo: https://github.com/Suga-bharathi/zynk-bites

Notes
- Do not commit `.env` or secrets
- For support or rollback, contact the maintainer or open an issue on the repo
