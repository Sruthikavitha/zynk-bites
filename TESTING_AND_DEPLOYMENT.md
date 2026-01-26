# TESTING & DEPLOYMENT GUIDE

## 🧪 TESTING PHASE

### 1. Verify All Services Running

```powershell
# Check PostgreSQL
docker ps | Select-String "zynk-postgres"

# Check Backend (should show port 5000)
netstat -ano | Select-String ":5000"

# Check Frontend (should show port 8080 or 5173)
netstat -ano | Select-String ":8080"
```

### 2. Test Backend API Endpoints

**Health Check:**
```powershell
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"2026-01-26T..."}
```

**Register User:**
```powershell
$body = @{
  email = "testuser@example.com"
  password = "password123"
  name = "Test User"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/auth/register `
  -ContentType "application/json" `
  -Body $body
```

**Login:**
```powershell
$body = @{
  email = "testuser@example.com"
  password = "password123"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body $body
```

### 3. Test Frontend

- Navigate to `http://localhost:8080`
- Register a new account
- Login with credentials
- Check browser console for errors
- Verify API calls are reaching backend

### 4. Manual Testing Checklist

- [ ] Backend health endpoint responds
- [ ] Can register new user via API
- [ ] Can login with registered credentials
- [ ] Frontend loads without errors
- [ ] Frontend-backend communication works
- [ ] Database queries execute successfully
- [ ] JWT tokens are generated
- [ ] CORS allows frontend requests

---

## 🚀 DEPLOYMENT PHASE

### Prerequisites

- Production PostgreSQL database (AWS RDS, Supabase, DigitalOcean, etc.)
- Hosting platform (Vercel, Netlify, Railway, Render, AWS, etc.)
- Domain name (optional)
- SSL certificate (auto-provided by most platforms)

### Step 1: Prepare Production Environment

#### Backend `.env` (Production)

```env
# Production Database
DATABASE_URL=postgresql://username:password@prod-db-host:5432/zynk_prod

# JWT Secret (generate strong random string)
JWT_SECRET=generate_strong_random_string_minimum_32_characters

# Environment
NODE_ENV=production
PORT=5000

# Frontend URL (CORS)
CLIENT_URL=https://yourdomain.com
```

**Generate JWT Secret:**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) -replace '[/\+\=]',''
```

#### Frontend `.env` (Production)

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_BACKEND_URL=https://api.yourdomain.com
```

### Step 2: Build for Production

#### Backend Build
```bash
cd backend
npm run build

# Output: dist/ folder with compiled JavaScript
```

#### Frontend Build
```bash
cd zynk-bites-main
npm run build

# Output: dist/ folder with optimized bundle
```

### Step 3: Deploy Backend

**Option A: Railway.app (Recommended - Easiest)**
1. Sign up at https://railway.app
2. Connect GitHub repo
3. Create new project
4. Add PostgreSQL plugin
5. Set environment variables from `.env`
6. Deploy (automatic on push)

**Option B: Render.com**
1. Sign up at https://render.com
2. New Web Service
3. Connect GitHub
4. Set environment variables
5. Deploy

**Option C: AWS EC2 / Docker**
```bash
# Build Docker image
docker build -t zynk-backend:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  zynk-backend:latest
```

### Step 4: Deploy Frontend

**Option A: Vercel (Recommended - Easiest)**
1. Sign up at https://vercel.com
2. Import GitHub repo
3. Select `zynk-bites-main` as root
4. Add environment variables
5. Deploy (automatic)

**Option B: Netlify**
1. Sign up at https://netlify.com
2. Connect GitHub
3. Set build command: `npm run build`
4. Set publish directory: `dist/`
5. Add environment variables
6. Deploy

**Option C: AWS S3 + CloudFront**
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket/

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Step 5: Configure Domain & SSL

Most platforms provide free SSL. Set up custom domain:
- `api.yourdomain.com` → Backend
- `yourdomain.com` → Frontend

Update frontend `.env` with production API URL.

### Step 6: Database Setup (Production)

**AWS RDS:**
```sql
-- Create production database
CREATE DATABASE zynk_prod;

-- Run migrations
npm run db:push
```

**Supabase:**
- Create project
- Copy connection string
- Update `DATABASE_URL`
- Migrations run automatically

### Step 7: Post-Deployment Verification

```bash
# Test production backend
curl https://api.yourdomain.com/api/health

# Test production frontend
open https://yourdomain.com

# Check logs
# Monitor error tracking (Sentry recommended)
```

---

## 📊 Deployment Checklist

- [ ] Production PostgreSQL provisioned and tested
- [ ] Backend environment variables configured
- [ ] Frontend environment variables configured
- [ ] Backend built successfully: `npm run build`
- [ ] Frontend built successfully: `npm run build`
- [ ] Backend deployed and health endpoint responds
- [ ] Frontend deployed and loads
- [ ] API endpoints accessible from frontend
- [ ] SSL/HTTPS working on both
- [ ] Domain configured correctly
- [ ] Error logging set up (optional: Sentry, LogRocket)
- [ ] Database backups configured
- [ ] Monitoring/Alerts configured

---

## 🚨 Common Issues & Solutions

**CORS Error on Frontend:**
- Verify `CLIENT_URL` in backend `.env` matches frontend domain
- Ensure backend returns proper CORS headers

**Database Connection Fails:**
- Test connection string: `psql <DATABASE_URL>`
- Verify network access (firewall, security groups)
- Check credentials in `.env`

**Frontend Can't Reach Backend:**
- Verify `VITE_API_URL` points to correct domain
- Check browser console for network errors
- Ensure backend is deployed and running

**401 Unauthorized on Protected Routes:**
- Token not being sent in `Authorization` header
- JWT_SECRET mismatch between backend and tokens
- Token expired

---

## 🔄 CI/CD Pipeline (Optional)

GitHub Actions workflow template:

```yaml
name: Deploy ZYNK

on:
  push:
    branches: [main, master]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Test Backend
        run: cd backend && npm install && npm run build
      
      - name: Test Frontend
        run: cd zynk-bites-main && npm install && npm run build
      
      - name: Deploy to Railway
        run: |
          # Railway CLI deployment
          npx railway up
```

---

## 📈 Production Recommendations

1. **Error Tracking:** Sentry, LogRocket
2. **Monitoring:** Datadog, New Relic
3. **Database Backups:** Automated daily backups
4. **CDN:** Cloudflare for frontend
5. **Rate Limiting:** Implement on API
6. **Logging:** Structured logging (Winston, Pino)
7. **Security:** HTTPS, CORS whitelist, input validation
8. **Performance:** Database indexing, query optimization

