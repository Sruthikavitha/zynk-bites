# 🚀 Deployment Instructions - Meal Recommendation Feature

## Pre-Deployment Checklist

- [x] All code written and tested
- [x] Types properly defined
- [x] Validation schema configured
- [x] Error handling implemented
- [x] Documentation complete
- [x] No database migrations needed
- [x] No breaking changes
- [x] Environment variables configured
- [x] JWT authentication enabled

---

## Step 1: Backend Setup

### 1.1 Verify Files Exist

```bash
cd backend/src

# Check service layer
ls services/mealRecommendationService.ts      # ✅ Should exist

# Check controller
ls controllers/recommendationController.ts    # ✅ Should exist

# Check routes
ls routes/recommendationRoutes.ts             # ✅ Should exist

# Check model
ls models/dishModel.ts                        # ✅ Should exist
```

### 1.2 Verify Dependencies

```bash
cd backend

# Check if TypeScript is installed
npm ls typescript

# Check if Zod is installed
npm ls zod

# Check if Express is installed
npm ls express

# If any missing, run:
npm install
```

### 1.3 Build Backend

```bash
cd backend

# Build TypeScript
npm run build

# Check for errors
# Should see: "Successfully compiled X files"
```

### 1.4 Test Backend

```bash
# Start backend server
npm run dev

# Should see:
# ✓ Database connected successfully
# 🚀 Server running on http://localhost:5000
# 📡 CORS enabled for http://localhost:5173
# 🔒 JWT authentication enabled
# ✓ All middleware and routes loaded
```

---

## Step 2: Frontend Setup

### 2.1 Verify Files Exist

```bash
cd src

# Check component
ls components/MealRecommendationWidget.tsx    # ✅ Should exist

# Check API service updated
grep -n "getMealRecommendations" services/api.ts

# Check types updated
grep -n "UserPreferences\|MealRecommendation" types/index.ts

# Check dashboard updated
grep -n "MealRecommendationWidget" components/dashboard/CustomerDashboard.tsx
```

### 2.2 Verify Dependencies

```bash
npm ls react react-dom
npm ls typescript
npm ls shadcn-ui

# If missing, install from frontend:
npm install
```

### 2.3 Build Frontend

```bash
npm run build

# Should complete without errors
# Check dist folder is generated
```

### 2.4 Test Frontend

```bash
# Start dev server
npm run dev

# Should see:
# VITE v... ready in ... ms
# ➜ Local: http://localhost:5173/
```

---

## Step 3: Integration Testing

### 3.1 Test without Authentication

```bash
# Should return 401 Unauthorized
curl -X POST http://localhost:5000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "dietType": "vegetarian",
      "healthGoal": "weight-loss",
      "allergies": [],
      "dislikedFoods": [],
      "mealHistory": []
    }
  }'
```

### 3.2 Test with Valid Token

```bash
# 1. First, login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'

# Response includes "token": "eyJhbG..."
# Copy the token

# 2. Then test recommendation with token
curl -X POST http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "dietType": "vegetarian",
      "healthGoal": "weight-loss",
      "allergies": [],
      "dislikedFoods": [],
      "mealHistory": []
    }
  }'

# Should return:
# {
#   "success": true,
#   "data": {
#     "breakfast": { ... },
#     "lunch": { ... },
#     "dinner": { ... },
#     "shortReason": "..."
#   },
#   "message": "Meal recommendations generated successfully"
# }
```

### 3.3 Test with Invalid Input

```bash
# Invalid diet type
curl -X POST http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "dietType": "invalid",
      "healthGoal": "weight-loss",
      "allergies": [],
      "dislikedFoods": [],
      "mealHistory": []
    }
  }'

# Should return 400 error with validation message
```

### 3.4 Test Frontend UI

```bash
# 1. Open http://localhost:5173
# 2. Login to dashboard
# 3. Find "Get Personalized Recommendations" section
# 4. Fill in preferences:
#    - Diet Type: Vegetarian
#    - Health Goal: Weight Loss
#    - Add allergy: peanuts
#    - Add dislike: mushrooms
# 5. Click "Get My Recommendations"
# 6. Should see results immediately
```

---

## Step 4: Production Build

### 4.1 Backend Production Build

```bash
cd backend

# Build for production
npm run build

# Run compiled code
npm start

# Monitor logs for errors
```

### 4.2 Frontend Production Build

```bash
cd frontend

# Build for production
npm run build

# Verify build output
ls dist/

# Should contain:
# - index.html
# - assets/ folder
# - No TypeScript source files
```

### 4.3 Environment Variables

```bash
# Backend .env
PORT=5000
CLIENT_URL=https://your-domain.com
NODE_ENV=production

# Frontend .env (if needed)
VITE_API_URL=https://api.your-domain.com/api
VITE_AUTH_TOKEN=<runtime-generated>
```

---

## Step 5: Deployment Platforms

### 5.1 Vercel (Frontend)

```bash
# 1. Connect repository to Vercel
# 2. Set build command: npm run build
# 3. Set output directory: dist
# 4. Environment variables:
#    VITE_API_URL=https://api.your-domain.com/api

# Deploy
vercel deploy

# Verify at https://zynk-bites.vercel.app
```

### 5.2 Railway (Backend)

```bash
# 1. Connect repository to Railway
# 2. Set build command: npm run build
# 3. Set start command: npm start
# 4. Environment variables:
#    PORT=5000
#    CLIENT_URL=https://your-domain.com
#    NODE_ENV=production

# Deploy
# Railway will automatically build and deploy
```

### 5.3 Heroku Alternative

```bash
# If using Heroku instead of Railway

# 1. Install Heroku CLI
npm install -g heroku

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create zynk-bites-api

# 4. Set environment variables
heroku config:set PORT=5000
heroku config:set CLIENT_URL=https://zynk-bites.vercel.app
heroku config:set NODE_ENV=production

# 5. Deploy
git push heroku main

# Monitor logs
heroku logs --tail
```

---

## Step 6: Post-Deployment Verification

### 6.1 Health Check

```bash
# Test API is running
curl https://api.your-domain.com/api/health

# Should return:
# { "status": "ok", "timestamp": "..." }
```

### 6.2 Test Recommendation Endpoint

```bash
# Get JWT token from login
JWT_TOKEN=$(curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass"}' \
  | jq -r '.token')

# Test recommendations
curl -X POST https://api.your-domain.com/api/recommendations \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "dietType": "vegetarian",
      "healthGoal": "weight-loss",
      "allergies": [],
      "dislikedFoods": [],
      "mealHistory": []
    }
  }'

# Should return 200 with recommendations
```

### 6.3 Frontend Verification

```bash
# 1. Visit https://zynk-bites.vercel.app
# 2. Login with test account
# 3. Navigate to dashboard
# 4. Check "Get Personalized Recommendations" appears
# 5. Test getting recommendations
# 6. Check browser console for errors
```

### 6.4 Performance Monitoring

```bash
# Monitor backend response time
# Should be < 200ms for typical request

# Monitor frontend bundle size
# Run: npm run build
# Check output size in terminal

# Monitor API rate limiting (if configured)
# Test multiple requests in sequence
```

---

## Step 7: Documentation & Handoff

### 7.1 Update Documentation

```bash
# Update README if needed
echo "## Meal Recommendations" >> README.md
echo "See MEAL_RECOMMENDATION_GUIDE.md for details" >> README.md

# Update API documentation
# Add endpoint to API_DOCUMENTATION.md

# Update changelog
echo "- Added AI meal recommendation feature" >> CHANGELOG.md
```

### 7.2 Team Communication

Send team email with:
- ✅ Feature is live at production URL
- 📖 Link to MEAL_RECOMMENDATION_GUIDE.md
- 🔧 Link to MEAL_RECOMMENDATION_QUICK_REFERENCE.md
- 🧪 Example API calls for testing
- 📊 Performance metrics
- 🆘 Support contact information

### 7.3 Monitoring Setup

```bash
# Set up error tracking (Sentry)
# Configure log aggregation (LogRocket)
# Set up performance monitoring (DataDog)
# Configure uptime monitoring (StatusPage)
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** JWT token missing or expired

**Solution:**
```bash
# Verify token is in Authorization header
# Format: Authorization: Bearer <token>

# Check token expiry
# Regenerate token by logging in again
```

### Issue: 400 Validation Error

**Cause:** Invalid input format

**Solution:**
```bash
# Check userPreferences structure
# Verify dietType is valid enum value
# Verify healthGoal is valid enum value
# Ensure allergies/dislikedFoods are arrays
```

### Issue: 404 No Meals Available

**Cause:** Database empty or no matching meals

**Solution:**
```bash
# Check dishModel.ts getSampleDishes()
# Verify meals are being returned
# Check filter criteria aren't too restrictive
```

### Issue: Slow Response Time

**Cause:** Too many meals or inefficient scoring

**Solution:**
```bash
# Check number of meals in database
# Profile scoring algorithm
# Consider caching results
# Optimize filter logic
```

### Issue: CORS Error

**Cause:** Frontend domain not whitelisted

**Solution:**
```bash
# Update backend CORS configuration
# Add frontend URL to CLIENT_URL env var
# Restart backend server
```

---

## Rollback Plan

If deployment issues occur:

```bash
# 1. Identify the issue
# Check logs and error messages

# 2. Quick fix (if minor)
# Push fix to main branch
# Re-deploy

# 3. Full rollback (if major)
# Deploy previous commit
git revert <commit-hash>
git push heroku main

# 4. Notify team
# Document issue in postmortem
# Plan improvements
```

---

## Performance Tuning

### Optimize Scoring Algorithm

```typescript
// In mealRecommendationService.ts
// Consider caching dish data:
const cachedDishes = new Map();

// Or implement batch processing:
const batchRecommendations = (requests) => {
  return requests.map(r => getMealRecommendations(r));
};
```

### Database Optimization

```bash
# Add indexes for frequently filtered fields:
- nutritionalInfo.calories
- category (veg/non-veg)
- isActive status

# Consider pagination for large meal lists:
SELECT * FROM dishes LIMIT 100 OFFSET 0;
```

### Frontend Optimization

```bash
# Code splitting
import { lazy, Suspense } from 'react';
const MealRecommendationWidget = lazy(() => 
  import('./MealRecommendationWidget')
);

# Memoization
import { memo } from 'react';
const Widget = memo(MealRecommendationWidget);
```

---

## Maintenance Schedule

```
Daily:
- Monitor error logs
- Check API response times

Weekly:
- Review user feedback
- Check recommendation accuracy

Monthly:
- Update meal database
- Analyze recommendation patterns
- Optimize scoring weights

Quarterly:
- Major feature updates
- Performance optimization
- User satisfaction survey
```

---

## Support Contacts

- **Backend Issues:** backend-team@zynk.com
- **Frontend Issues:** frontend-team@zynk.com
- **Database Issues:** data-team@zynk.com
- **Deployment Issues:** devops-team@zynk.com

---

## Sign-Off

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Integration tests passed
- [ ] Production verification complete
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Ready for production

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Verified By:** ___________  
**Sign-Off Date:** ___________

---

*For detailed information, refer to the specific guides and documentation.*
