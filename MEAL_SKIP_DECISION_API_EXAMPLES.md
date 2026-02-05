# Meal Skip Decision API - Examples & Test Cases

## 📋 Complete API Examples

### Example 1: Low Risk - Safe to Skip

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "lunch",
    "skipCount": 1,
    "healthGoal": "weight-loss",
    "subscriptionStatus": "active",
    "consecutiveSkips": 0,
    "lastMealTime": "2024-01-15T12:00:00Z"
  }'
```

**Response (200 OK):**
```json
{
  "action": "skip",
  "message": "Low risk: It's safe to skip lunch today. You've only skipped 1 meal(s) this week, and your weight-loss goal allows for occasional skips. Listen to your body and stay hydrated!",
  "riskScore": 0,
  "lightMealSuggestions": [],
  "healthTips": [
    "Lunch maintains your energy levels throughout the afternoon - consider eating even if skipping dinner",
    "While occasional meal skipping can fit some diets, aim for balanced portions instead",
    "Regular meals actually support metabolism better than sporadic eating"
  ]
}
```

---

### Example 2: Medium Risk - Suggest Light Meal

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "breakfast",
    "skipCount": 3,
    "healthGoal": "balanced",
    "subscriptionStatus": "active",
    "consecutiveSkips": 0,
    "lastMealTime": "2024-01-14T20:30:00Z"
  }'
```

**Response (200 OK):**
```json
{
  "action": "suggest_light_meal",
  "message": "Moderate risk: Instead of skipping breakfast entirely, consider a light meal. You've skipped 3 meal(s) this week, and with your balanced goal, maintaining some nutrition is important. We've suggested some light options below.",
  "riskScore": 2.0,
  "lightMealSuggestions": [
    {
      "name": "Greek Yogurt & Berries",
      "calories": 150,
      "description": "Protein-rich yogurt with antioxidant berries"
    },
    {
      "name": "Banana & Almond Butter",
      "calories": 200,
      "description": "Quick energy with healthy fats"
    },
    {
      "name": "Oatmeal with Honey",
      "calories": 180,
      "description": "Sustained energy from complex carbs"
    }
  ],
  "healthTips": [
    "Breakfast is your most important meal - it jumpstarts metabolism and sets energy levels for the day",
    "For balanced nutrition, maintaining some nutrition is important",
    "You've already skipped 3 meals this week - prioritize nutrition for the rest of the week"
  ]
}
```

---

### Example 3: High Risk - Strong Warning

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "breakfast",
    "skipCount": 5,
    "healthGoal": "muscle-gain",
    "subscriptionStatus": "active",
    "consecutiveSkips": 2,
    "lastMealTime": "2024-01-14T19:00:00Z"
  }'
```

**Response (200 OK):**
```json
{
  "action": "suggest_light_meal",
  "message": "High risk: We strongly recommend having a light meal instead of skipping breakfast. With 2 consecutive skip(s) and your muscle-gain goal, regular nutrition is essential for your health goals. Check the light meal suggestions below.",
  "riskScore": 8.0,
  "lightMealSuggestions": [
    {
      "name": "Greek Yogurt & Berries",
      "calories": 150,
      "description": "Protein-rich yogurt with antioxidant berries (High protein)"
    },
    {
      "name": "Banana & Almond Butter",
      "calories": 200,
      "description": "Quick energy with healthy fats (High protein)"
    },
    {
      "name": "Oatmeal with Honey",
      "calories": 180,
      "description": "Sustained energy from complex carbs (High protein)"
    }
  ],
  "healthTips": [
    "Breakfast is your most important meal - it jumpstarts metabolism and sets energy levels for the day",
    "For muscle gain, consistent protein intake throughout the day is crucial - try to maintain all meal times",
    "Missing meals can reduce protein synthesis and muscle building potential",
    "You've already skipped 5 meals this week - prioritize nutrition for the rest of the week"
  ]
}
```

---

### Example 4: Paused Subscription - Service Unavailable

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "lunch",
    "skipCount": 0,
    "healthGoal": "balanced",
    "subscriptionStatus": "paused",
    "consecutiveSkips": 0
  }'
```

**Response (200 OK):**
```json
{
  "action": "reschedule",
  "message": "Your subscription is currently paused. Please reactivate your subscription to continue with meal planning. Contact support for assistance.",
  "riskScore": 10.0,
  "lightMealSuggestions": null,
  "healthTips": [
    "Reactivate your subscription to get personalized meal guidance",
    "Contact our support team if you need help with your subscription"
  ]
}
```

---

### Example 5: Cancelled Subscription - Service Unavailable

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "dinner",
    "skipCount": 2,
    "healthGoal": "energy-boost",
    "subscriptionStatus": "cancelled",
    "consecutiveSkips": 1
  }'
```

**Response (200 OK):**
```json
{
  "action": "reschedule",
  "message": "Your subscription is currently cancelled. Please reactivate your subscription to continue with meal planning. Contact support for assistance.",
  "riskScore": 10.0,
  "lightMealSuggestions": null,
  "healthTips": [
    "Reactivate your subscription to get personalized meal guidance",
    "Contact our support team if you need help with your subscription"
  ]
}
```

---

### Example 6: Energy Boost Goal

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "breakfast",
    "skipCount": 2,
    "healthGoal": "energy-boost",
    "subscriptionStatus": "active",
    "consecutiveSkips": 0
  }'
```

**Response (200 OK):**
```json
{
  "action": "suggest_light_meal",
  "message": "Moderate risk: Instead of skipping breakfast entirely, consider a light meal. You've skipped 2 meal(s) this week, and with your energy-boost goal, maintaining some nutrition is important. We've suggested some light options below.",
  "riskScore": 2.5,
  "lightMealSuggestions": [
    {
      "name": "Banana & Almond Butter",
      "calories": 200,
      "description": "Quick energy with healthy fats"
    },
    {
      "name": "Oatmeal with Honey",
      "calories": 180,
      "description": "Sustained energy from complex carbs"
    },
    {
      "name": "Greek Yogurt & Berries",
      "calories": 150,
      "description": "Protein-rich yogurt with antioxidant berries"
    }
  ],
  "healthTips": [
    "Breakfast is your most important meal - it jumpstarts metabolism and sets energy levels for the day",
    "Consistent meals throughout the day maintain stable blood sugar and energy levels",
    "Skipping meals can cause energy crashes and reduced productivity"
  ]
}
```

---

### Example 7: Improved Digestion Goal

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "lunch",
    "skipCount": 4,
    "healthGoal": "improved-digestion",
    "subscriptionStatus": "active",
    "consecutiveSkips": 1
  }'
```

**Response (200 OK):**
```json
{
  "action": "suggest_light_meal",
  "message": "Moderate risk: Instead of skipping lunch entirely, consider a light meal. You've skipped 4 meal(s) this week, and with your improved-digestion goal, maintaining some nutrition is important.",
  "riskScore": 2.0,
  "lightMealSuggestions": [
    {
      "name": "Hummus & Veggie Sticks",
      "calories": 180,
      "description": "Plant-based protein with fiber"
    },
    {
      "name": "Chicken Salad",
      "calories": 250,
      "description": "Lean protein with fresh vegetables"
    },
    {
      "name": "Tuna Wrap",
      "calories": 280,
      "description": "Omega-3 rich protein with whole grains"
    }
  ],
  "healthTips": [
    "Lunch maintains your energy levels throughout the afternoon - consider eating even if skipping dinner",
    "Regular meal timing helps establish healthy digestive rhythms",
    "Avoid large gaps between meals for optimal digestive health",
    "You've already skipped 4 meals this week - prioritize nutrition for the rest of the week"
  ]
}
```

---

### Example 8: Dinner with High Skip Count

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "mealType": "dinner",
    "skipCount": 6,
    "healthGoal": "balanced",
    "subscriptionStatus": "active",
    "consecutiveSkips": 0
  }'
```

**Response (200 OK):**
```json
{
  "action": "suggest_light_meal",
  "message": "High risk: We strongly recommend having a light meal instead of skipping dinner. With 0 consecutive skip(s) and your balanced goal, regular nutrition is essential for your health goals.",
  "riskScore": 7.5,
  "lightMealSuggestions": [
    {
      "name": "Grilled Fish & Steamed Broccoli",
      "calories": 300,
      "description": "Light protein with essential nutrients"
    },
    {
      "name": "Vegetable Soup",
      "calories": 150,
      "description": "Warming and nutritious"
    },
    {
      "name": "Egg Whites with Toast",
      "calories": 200,
      "description": "Lean protein before bed"
    }
  ],
  "healthTips": [
    "A light dinner helps regulate sleep and recovery - avoid skipping if possible",
    "While occasional meal skipping can fit some diets, aim for balanced portions instead",
    "You've already skipped 6 meals this week - prioritize nutrition for the rest of the week"
  ]
}
```

---

## ❌ Error Examples

### Validation Error - Invalid Meal Type

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "mealType": "snack",
    "skipCount": 2,
    "healthGoal": "balanced",
    "subscriptionStatus": "active"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error: Invalid meal type. Must be one of: breakfast, lunch, dinner"
}
```

---

### Validation Error - Invalid Health Goal

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "mealType": "breakfast",
    "skipCount": 2,
    "healthGoal": "bodybuilding",
    "subscriptionStatus": "active"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error: Invalid health goal. Must be one of: weight-loss, muscle-gain, balanced, improved-digestion, energy-boost"
}
```

---

### Validation Error - Negative Skip Count

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "mealType": "breakfast",
    "skipCount": -5,
    "healthGoal": "balanced",
    "subscriptionStatus": "active"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation error: skipCount must be a non-negative number"
}
```

---

### Authentication Error - Missing Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -d '{
    "mealType": "breakfast",
    "skipCount": 2,
    "healthGoal": "balanced",
    "subscriptionStatus": "active"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Authentication required. Please provide a valid JWT token."
}
```

---

### Authentication Error - Invalid Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/skip-decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token-xyz" \
  -d '{
    "mealType": "breakfast",
    "skipCount": 2,
    "healthGoal": "balanced",
    "subscriptionStatus": "active"
  }'
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid authentication token."
}
```

---

### Server Error - Unexpected Exception

**Request:** (Valid request, but server encountered an error)

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "An unexpected error occurred. Please try again later."
}
```

---

## 🧪 Postman Collection

### Setup
1. Open Postman
2. Create new collection "ZYNK Meal Skip Decision"
3. Add the following requests

### Request 1: Get Token (If needed)
```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Request 2: Low Risk Decision
```
POST {{base_url}}/api/skip-decision
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "mealType": "lunch",
  "skipCount": 1,
  "healthGoal": "weight-loss",
  "subscriptionStatus": "active",
  "consecutiveSkips": 0
}
```

### Request 3: High Risk Decision
```
POST {{base_url}}/api/skip-decision
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "mealType": "breakfast",
  "skipCount": 5,
  "healthGoal": "muscle-gain",
  "subscriptionStatus": "active",
  "consecutiveSkips": 2
}
```

### Request 4: Invalid Request
```
POST {{base_url}}/api/skip-decision
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "mealType": "invalid",
  "skipCount": 2,
  "healthGoal": "balanced",
  "subscriptionStatus": "active"
}
```

### Postman Environment Variables
```json
{
  "base_url": "http://localhost:5000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Test Matrix

### All Health Goals
| Health Goal | Meal Type | Skip Count | Expected Score | Action |
|------------|-----------|-----------|-----------------|---------|
| weight-loss | lunch | 0 | 0 | skip |
| muscle-gain | breakfast | 3 | 5.5 | suggest |
| balanced | dinner | 2 | 2.5 | suggest |
| energy-boost | breakfast | 4 | 5.0 | suggest |
| improved-digestion | lunch | 1 | 1.0 | skip |

### All Meal Types
| Meal Type | Health Goal | Skip Count | Consecutive | Expected Score |
|-----------|------------|-----------|-------------|-----------------|
| breakfast | balanced | 2 | 0 | 2.0 |
| lunch | muscle-gain | 2 | 0 | 3.0 |
| dinner | weight-loss | 2 | 0 | 1.5 |
| breakfast | energy-boost | 3 | 1 | 4.0 |
| lunch | muscle-gain | 5 | 2 | 7.0 |

### Edge Cases
| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Zero skips | skipCount: 0 | Lowest possible score |
| Maximum skips | skipCount: 21 | High score (< 7) |
| No consecutive | consecutiveSkips: 0 | No penalty |
| High consecutive | consecutiveSkips: 7 | High score (potentially > 10) |
| Paused sub | subscriptionStatus: paused | Score 10, reschedule |

---

## 🎯 Frontend Integration Testing

### Test in React Component
```typescript
import { getSkipDecision } from '@/services/api';

// Test Case 1: Low Risk
const response1 = getSkipDecision({
  mealType: 'lunch',
  skipCount: 1,
  healthGoal: 'weight-loss',
  subscriptionStatus: 'active'
});
console.assert(response1.action === 'skip', 'Should be safe to skip');
console.assert(response1.riskScore < 4, 'Risk should be low');

// Test Case 2: Medium Risk
const response2 = getSkipDecision({
  mealType: 'breakfast',
  skipCount: 3,
  healthGoal: 'balanced',
  subscriptionStatus: 'active'
});
console.assert(response2.action === 'suggest_light_meal', 'Should suggest alternative');
console.assert(response2.lightMealSuggestions.length > 0, 'Should have suggestions');

// Test Case 3: Paused Subscription
const response3 = getSkipDecision({
  mealType: 'breakfast',
  skipCount: 0,
  healthGoal: 'balanced',
  subscriptionStatus: 'paused'
});
console.assert(response3.action === 'reschedule', 'Should reschedule');
console.assert(response3.riskScore === 10, 'Risk should be maximum');
```

---

## 📋 Checklist for Testing

- [ ] Test all 5 health goals
- [ ] Test all 3 meal types
- [ ] Test skip counts 0, 1, 3, 5, 21
- [ ] Test consecutive skips 0, 1, 2+
- [ ] Test active subscription
- [ ] Test paused subscription
- [ ] Test cancelled subscription
- [ ] Test with optional fields
- [ ] Test without optional fields
- [ ] Test invalid meal type
- [ ] Test invalid health goal
- [ ] Test negative skip count
- [ ] Test string skip count (should validate)
- [ ] Test missing authentication
- [ ] Test invalid token
- [ ] Verify response time < 50ms
- [ ] Verify light meal suggestions match meal type
- [ ] Verify health tips are personalized
- [ ] Check risk score is always 0-10
- [ ] Verify error messages are helpful

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**API Status:** ✅ Production Ready
