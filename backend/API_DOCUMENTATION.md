# ZYNK Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 **Auth Endpoints**

### 1. Register User
```
POST /auth/register
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "customer",
  "phone": "555-1234"
}
```

**For Chef Role:**
```json
{
  "fullName": "Chef Jane",
  "email": "jane@example.com",
  "password": "securepass123",
  "role": "chef",
  "chefBusinessName": "Jane's Catering",
  "phone": "555-5678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "customer"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid email, password < 6 chars)
- `409` - Email already registered

---

### 2. Login
```
POST /auth/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "customer"
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `403` - Account inactive

---

### 3. Get Profile
```
GET /auth/profile
Headers: Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "customer",
    "phone": "555-1234",
    "isActive": true,
    "createdAt": "2026-01-26T10:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - User not found

---

## 🍽️ **Subscription Endpoints**

All subscription endpoints require `Authorization: Bearer <JWT_TOKEN>` and `role: customer`

### 1. Create Subscription
```
POST /subscriptions
```
**Request Body:**
```json
{
  "planName": "Premium",
  "mealsPerWeek": 5,
  "priceInCents": 4999,
  "deliveryAddress": "123 Main St",
  "postalCode": "10001",
  "city": "New York"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "id": 1,
    "userId": 1,
    "planName": "Premium",
    "mealsPerWeek": 5,
    "priceInCents": 4999,
    "deliveryAddress": "123 Main St",
    "postalCode": "10001",
    "city": "New York",
    "status": "active",
    "nextBillingDate": "2026-02-01T00:00:00Z",
    "isSkipSwapLocked": false,
    "createdAt": "2026-01-26T10:00:00Z",
    "updatedAt": "2026-01-26T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - User already has active subscription

---

### 2. Get All Subscriptions
```
GET /subscriptions
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "subscriptions": [
    {
      "id": 1,
      "userId": 1,
      "planName": "Premium",
      "status": "active",
      ...
    }
  ]
}
```

---

### 3. Get Single Subscription
```
GET /subscriptions/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    ...
  }
}
```

**Error Responses:**
- `404` - Subscription not found
- `403` - Access denied (not owner)

---

### 4. Update Address
```
PUT /subscriptions/:id/address
```
⏱️ **Available:** Monday-Friday before 8 PM  
🔒 **Locked:** Friday 8 PM - Sunday 11:59 PM

**Request Body:**
```json
{
  "deliveryAddress": "456 Oak Ave",
  "postalCode": "10002",
  "city": "Brooklyn"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "subscription": { ... }
}
```

**Error Responses:**
- `400` - Validation error
- `423` - Locked (after 8 PM Friday)
  ```json
  {
    "success": false,
    "message": "Address changes are locked (after 8 PM Friday)",
    "nextAvailableAt": "2026-02-02T00:00:00Z"
  }
  ```

---

### 5. Skip Meal
```
POST /subscriptions/:id/skip
```
⏱️ **Available:** Monday-Friday before 8 PM  
🔒 **Locked:** Friday 8 PM - Sunday 11:59 PM

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Meal skipped successfully",
  "subscription": { ... }
}
```

**Error Responses:**
- `423` - Locked with `nextAvailableAt` timestamp

---

### 6. Swap Meal
```
POST /subscriptions/:id/swap
```
⏱️ **Available:** Monday-Friday before 8 PM  
🔒 **Locked:** Friday 8 PM - Sunday 11:59 PM

**Request Body:**
```json
{
  "newMealId": 42
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Meal swapped successfully",
  "subscription": { ... }
}
```

**Error Responses:**
- `400` - Missing newMealId
- `423` - Locked with `nextAvailableAt` timestamp

---

### 7. Pause Subscription
```
POST /subscriptions/:id/pause
```
⏱️ **Available:** Anytime (no lock)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription paused successfully",
  "subscription": {
    ...
    "status": "paused"
  }
}
```

---

### 8. Resume Subscription
```
POST /subscriptions/:id/resume
```
⏱️ **Available:** Anytime (no lock)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription resumed successfully",
  "subscription": {
    ...
    "status": "active",
    "nextBillingDate": "2026-02-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Subscription is not paused

---

### 9. Cancel Subscription
```
DELETE /subscriptions/:id/cancel
```
⏱️ **Available:** Anytime (no lock)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "subscription": {
    ...
    "status": "cancelled"
  }
}
```

---

### 10. Check Lock Status
```
GET /subscriptions/status/lock
```
**Public endpoint (no auth required)**

**Response (200 OK):**
```json
{
  "success": true,
  "isLocked": false,
  "message": "Skip/swap operations are allowed",
  "nextAvailableAt": null
}
```

**When Locked:**
```json
{
  "success": true,
  "isLocked": true,
  "message": "Skip/swap operations are currently locked",
  "nextAvailableAt": "2026-02-02T00:00:00Z"
}
```

---

## 📊 **HTTP Status Codes**

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Login successful, operation completed |
| 201 | Created | User/subscription created |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User lacks required role or access |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already registered, duplicate subscription |
| 423 | Locked | Skip/swap locked after 8 PM Friday |
| 500 | Server Error | Database/server issue |

---

## 🔒 **Lock Logic Explanation**

**Skip/Swap Locked Times:**
- Friday 20:00 (8 PM) onwards
- Saturday (all day)
- Sunday (all day)

**Skip/Swap Available:**
- Monday 00:00 - Friday 19:59 (before 8 PM)

**Response when locked:**
```json
{
  "success": false,
  "message": "Operations are locked (after 8 PM Friday). Available after Sunday.",
  "nextAvailableAt": "2026-02-02T00:00:00Z"
}
```

---

## 💡 **Example Workflow**

1. **Register Customer:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "fullName": "Alice Smith",
       "email": "alice@example.com",
       "password": "password123"
     }'
   ```
   Returns: `token: abc123...`

2. **Create Subscription:**
   ```bash
   curl -X POST http://localhost:5000/api/subscriptions \
     -H "Authorization: Bearer abc123..." \
     -H "Content-Type: application/json" \
     -d '{
       "planName": "Premium",
       "mealsPerWeek": 5,
       "priceInCents": 4999,
       "deliveryAddress": "123 Main",
       "postalCode": "10001",
       "city": "NYC"
     }'
   ```

3. **Check Lock Status (Monday 2 PM):**
   ```bash
   curl http://localhost:5000/api/subscriptions/status/lock
   ```
   Returns: `isLocked: false` ✅ Can skip/swap

4. **Skip Meal:**
   ```bash
   curl -X POST http://localhost:5000/api/subscriptions/1/skip \
     -H "Authorization: Bearer abc123..."
   ```
   Returns: Success ✅

5. **Check Lock Status (Friday 9 PM):**
   ```bash
   curl http://localhost:5000/api/subscriptions/status/lock
   ```
   Returns: `isLocked: true`, `nextAvailableAt: 2026-02-02T00:00:00Z` 🔒

---

## 🧪 **Testing with Postman/cURL**

Import this environment:
```json
{
  "token": "your_jwt_token_here",
  "baseUrl": "http://localhost:5000/api"
}
```

Use `{{baseUrl}}` and `{{token}}` in requests for quick testing.
