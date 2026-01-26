# ZYNK DEPLOYMENT - RAILWAY + VERCEL

## 🎯 Deployment Plan

**Backend**: Railway.app (5 minutes, handles PostgreSQL too)  
**Frontend**: Vercel (5 minutes, optimized for React)

### Why These Platforms?
- ✅ Free tier available
- ✅ Auto-deploy from GitHub
- ✅ PostgreSQL built-in (Railway)
- ✅ Global CDN (Vercel)
- ✅ Environment variables managed securely
- ✅ Zero configuration needed
- ✅ Automatic SSL/HTTPS

---

## STEP 1: Deploy Backend to Railway.app

### 1.1 Sign Up & Connect GitHub

1. Go to https://railway.app
2. Click "Start a Project"
3. Select "Deploy from GitHub" 
4. Authorize Railway to access your GitHub
5. Select your `zynk-bites` repository

### 1.2 Configure Backend Service

1. **Choose Root Directory**: `backend/`
2. **Add Environment Variables**:
   - Click "Add Variable"
   - Add these:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/zynk_prod
JWT_SECRET=generate_with_this_command
NODE_ENV=production
CLIENT_URL=https://YOUR_FRONTEND_VERCEL_URL.com
```

**Generate Strong JWT_SECRET** (run in terminal):
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) -replace '[/\+\=]', ''
```

### 1.3 Railway Creates PostgreSQL Automatically

Railway will prompt you to add a PostgreSQL plugin:
1. Click "Add → PostgreSQL"
2. PostgreSQL service is created
3. Environment variables auto-populated:
   - `DATABASE_URL` - Copy this value
   - It will look like: `postgresql://user:pass@host:5432/db`

**Important**: Railway auto-generates the DATABASE_URL. Copy this value and update the `DATABASE_URL` variable in your Railway backend project.

### 1.4 Deploy

1. Go to your Railway backend project
2. Click "Deploy" (bottom right)
3. Select branch `main`/`master`
4. Wait for deployment (2-3 minutes)

**Watch the Build Log**:
```
✓ Installing dependencies
✓ Building TypeScript
✓ Running migrations
✓ Server listening on port 5000
```

### 1.5 Get Backend URL

1. On Railway dashboard, click your backend service
2. Click "Settings"
3. Copy the **Public URL** (looks like: `https://zynk-backend-prod.railway.app`)
4. Save this - you'll need it for frontend!

---

## STEP 2: Deploy Frontend to Vercel

### 2.1 Sign Up & Connect GitHub

1. Go to https://vercel.com
2. Click "Add New..."
3. Select "Project"
4. Select your `zynk-bites` repository
5. Authorize Vercel to access GitHub

### 2.2 Configure Project

1. **Framework**: Vite (auto-detected)
2. **Root Directory**: `./zynk-bites-main`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `dist` (auto-detected)

### 2.3 Add Environment Variables

1. Click "Environment Variables"
2. Add:

```
VITE_API_URL=https://YOUR_RAILWAY_BACKEND_URL/api
VITE_BACKEND_URL=https://YOUR_RAILWAY_BACKEND_URL
```

Replace `YOUR_RAILWAY_BACKEND_URL` with the URL from Step 1.5 (e.g., `https://zynk-backend-prod.railway.app`)

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build (2-3 minutes)

**Watch the Build Log**:
```
✓ Installed dependencies
✓ Built successfully
✓ Optimized for production
✓ Published to Vercel
```

### 2.5 Get Frontend URL

1. After deployment, you'll see a green checkmark
2. **Production URL** shows at top (looks like: `https://zynk-bites.vercel.app`)
3. Save this URL!

---

## STEP 3: Connect Frontend to Backend

### 3.1 Update Backend CORS

Go back to Railway backend settings:
1. Edit `CLIENT_URL` variable
2. Set to your Vercel frontend URL from Step 2.5
3. Example: `https://zynk-bites.vercel.app`
4. Redeploy backend (Railway auto-deploys on env change)

### 3.2 Verify Connection

1. Open your Vercel frontend URL
2. Try to register a new user
3. Check browser Network tab for API calls
4. Should see requests to your Railway backend ✅

---

## STEP 4: Verify Everything Works

### 4.1 Test Backend Health

```bash
curl https://YOUR_RAILWAY_URL/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 4.2 Test Registration

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 4.3 Test Frontend

1. Visit your Vercel URL
2. Register a new account
3. Login with credentials
4. Create a subscription
5. All data should persist in PostgreSQL

---

## 🎁 BONUS: Custom Domain

### Add Domain to Vercel

1. Go to your Vercel project
2. Settings → Domains
3. Add your domain (yourdomain.com)
4. Follow Vercel's DNS setup
5. SSL auto-enabled ✅

### Add Domain to Railway (Optional)

1. Railway backend settings
2. Add custom domain
3. Update your DNS records
4. SSL auto-enabled ✅

---

## 📊 Final Setup

After deployment, you'll have:

```
┌────────────────────────────────────┐
│  Frontend                          │
│  https://zynk-bites.vercel.app    │
└──────────────┬─────────────────────┘
               │
               │ HTTPS API Calls
               │
               ↓
┌────────────────────────────────────┐
│  Backend                           │
│  https://zynk-backend.railway.app │
└──────────────┬─────────────────────┘
               │
               │ PostgreSQL Queries
               │
               ↓
┌────────────────────────────────────┐
│  Database (PostgreSQL)             │
│  Managed by Railway                │
└────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

- [ ] GitHub account with repo pushed
- [ ] Railway.app account created
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database working
- [ ] Backend health endpoint responds
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Frontend connects to backend
- [ ] Can register new user
- [ ] Can login
- [ ] Data persists in database

---

## 🔗 Keep These URLs

After deployment, save:
- **Frontend URL**: https://zynk-bites.vercel.app
- **Backend URL**: https://zynk-backend-prod.railway.app
- **GitHub Repo**: https://github.com/Suga-bharathi/zynk-bites

---

## 🚨 If Something Goes Wrong

### Backend won't deploy:
```bash
# Check logs in Railway dashboard
# Look for DATABASE_URL or JWT_SECRET errors
# Verify environment variables are set
```

### Frontend can't reach backend:
```bash
# Check VITE_API_URL in Vercel settings
# Open browser DevTools → Network tab
# Should see requests going to Railway backend
```

### Database not connecting:
```bash
# Railway should auto-create PostgreSQL
# Check DATABASE_URL in Railway settings
# Should match: postgresql://user:pass@host:5432/db
```

---

## 🎉 You're Live!

Congratulations! Your ZYNK app is now deployed and accessible worldwide! 

**Share these URLs**:
- 🌐 **Frontend**: https://zynk-bites.vercel.app
- 📡 **API**: https://zynk-backend-prod.railway.app
- 💻 **GitHub**: https://github.com/Suga-bharathi/zynk-bites

