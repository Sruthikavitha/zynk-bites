# ZYNK DATABASE SETUP - COMPLETE GUIDE

## ✅ What's Been Done

1. Created `DATABASE_SETUP.md` with full instructions
2. Updated `.env` for local development:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zynk_db`
   - `NODE_ENV=development`

---

## 🚀 NEXT STEPS (Choose ONE option)

### **Option 1: Docker Setup (Recommended - Fastest)**

**Prerequisites:** Docker Desktop installed

**Commands:**
```powershell
# Start PostgreSQL container
docker run --name zynk-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=zynk_db `
  -p 5432:5432 `
  -d postgres:latest

# Wait 5 seconds for container to start, then run migrations
Start-Sleep -Seconds 5

cd backend
npm run db:generate
npm run db:migrate

# Start backend
npm run dev
```

**Stop container later:**
```powershell
docker stop zynk-postgres
```

---

### **Option 2: PostgreSQL Local Installation**

**Prerequisites:** PostgreSQL installed locally

**Steps:**
1. Install from: https://www.postgresql.org/download/windows/
2. Use credentials: user=`postgres`, password=`postgres`
3. Create database in SQL Shell or pgAdmin:
   ```sql
   CREATE DATABASE zynk_db;
   ```
4. Run migrations:
   ```powershell
   cd backend
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

---

### **Option 3: Cloud Database (AWS RDS / Supabase)**

**Update `.env` with your cloud database URL:**
```env
DATABASE_URL=postgresql://user:password@your-host:5432/zynk_db
```

Then run migrations:
```powershell
cd backend
npm run db:generate
npm run db:migrate
npm run dev
```

---

## ✅ Verification

After running migrations, you should see:
```
✓ Database connected successfully
🚀 Server running on http://localhost:5000
```

Test with:
```bash
curl http://localhost:5000/api/auth/health
```

---

## 📊 Status After Setup

| Step | Command | Status |
|------|---------|--------|
| ✅ .env configured | Ready | Done |
| ⏳ PostgreSQL running | Start container/service | Pending |
| ⏳ Migrations applied | `npm run db:migrate` | Pending |
| ⏳ Backend started | `npm run dev` | Pending |

