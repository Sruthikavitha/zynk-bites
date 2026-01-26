@echo off
SETLOCAL

:: --- 1. Start Docker Postgres ---
echo Starting PostgreSQL container...
docker pull postgres:15
docker stop zynk-db 2>nul
docker rm zynk-db 2>nul
docker run --name zynk-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=pass123 -e POSTGRES_DB=zynkdb -p 5432:5432 -d postgres

:: --- 2. Wait for Postgres to initialize ---
echo Waiting 10 seconds for PostgreSQL to start...
timeout /t 10 /nobreak >nul

:: --- 3. Run Drizzle ORM migrations ---
echo Running database migrations...
npx drizzle-kit generate:migration
npx drizzle-kit migrate

:: --- 4. Install dependencies ---
echo Installing npm dependencies...
npm install

:: --- 5. Build TypeScript ---
echo Building TypeScript code...
npm run build

:: --- 6. Start development server ---
echo Starting backend server...
npm run dev

ENDLOCAL
pause
