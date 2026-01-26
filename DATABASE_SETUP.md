# DATABASE SETUP GUIDE

## Step 1: Choose PostgreSQL Installation Method

### Option A: Docker (Fastest & Recommended)
```powershell
docker run --name zynk-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=zynk_db `
  -p 5432:5432 `
  -d postgres:latest
```

### Option B: PostgreSQL Local Installation
1. Download: https://www.postgresql.org/download/windows/
2. Install with defaults (user: postgres, password: postgres)
3. After install, create database:
```sql
CREATE DATABASE zynk_db;
```

---

## Step 2: Create .env File in Backend

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zynk_db
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

---

## Step 3: Run Database Migrations

```bash
cd backend

# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

---

## Step 4: Start Backend Server

```bash
npm run dev
```

Expected output:
```
✓ Database connected successfully
🚀 Server running on http://localhost:5000
```

---

## Troubleshooting

**Error: "Cannot connect to database"**
- Ensure PostgreSQL is running (Docker container or local service)
- Verify DATABASE_URL in .env
- Check port 5432 is available

**Error: "DATABASE_URL not set"**
- Create/update `backend/.env` file with DATABASE_URL

**Docker: Container already exists**
```powershell
docker rm -f zynk-postgres
docker run --name zynk-postgres ...
```

