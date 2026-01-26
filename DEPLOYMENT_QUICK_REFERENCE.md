# QUICK DEPLOYMENT REFERENCE

## 🚀 Railway Backend (5 min)

1. **Sign Up**: https://railway.app
2. **New Project** → "Deploy from GitHub"
3. **Select**: `zynk-bites` repo → `backend/` root
4. **Add PostgreSQL**: Click "Add" → PostgreSQL (auto-creates DB)
5. **Environment Variables**:
   ```
   DATABASE_URL=<auto-filled by Railway>
   JWT_SECRET=<generate strong random string>
   NODE_ENV=production
   CLIENT_URL=<your Vercel URL>
   ```
6. **Deploy** → Wait 2-3 min
7. **Get URL**: Settings → Public URL (save this!)

---

## 🌐 Vercel Frontend (5 min)

1. **Sign Up**: https://vercel.com
2. **New Project** → Import from GitHub
3. **Select**: `zynk-bites` repo
4. **Root**: `./zynk-bites-main`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://YOUR_RAILWAY_URL/api
   VITE_BACKEND_URL=https://YOUR_RAILWAY_URL
   ```
   (Replace with your Railway URL from step 1)
6. **Deploy** → Wait 2-3 min
7. **Get URL**: Shown at top after deploy

---

## 🔗 Connect Them

1. Go back to Railway backend
2. Update `CLIENT_URL` = your Vercel URL
3. Railway auto-redeploys

---

## ✅ Test

- Open Vercel URL
- Try to register
- Check Network tab → should see API calls to Railway
- Done! 🎉

---

## 🔑 Generate JWT Secret (One-time)

**Windows PowerShell**:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) -replace '[/\+\=]', ''
```

**Mac/Linux**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 After Deploy

| What | Where |
|------|-------|
| Frontend | https://zynk-bites.vercel.app |
| Backend | https://zynk-backend-prod.railway.app |
| Database | PostgreSQL (Railway) |
| Code | GitHub (auto-deploys on push) |
| SSL | ✅ Automatic |

---

## 🆘 Troubleshooting

**Backend won't start**
- Check `DATABASE_URL` in Railway
- Check `JWT_SECRET` is set
- View logs in Railway dashboard

**Frontend can't reach backend**
- Check `VITE_API_URL` in Vercel
- Must include `/api` at end
- Backend URL should be exact match

**"Cannot connect to database"**
- Railway auto-creates PostgreSQL
- Migrations auto-run
- Check DATABASE_URL format

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- GitHub: Your repo for code issues

