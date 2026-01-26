# ZYNK Backend - Node.js + Express + PostgreSQL

A production-ready food subscription app backend built with Express.js, PostgreSQL, Drizzle ORM, JWT authentication, and bcrypt.

## Project Structure

```
backend/
├── src/
│   ├── models/          # Drizzle ORM database schemas
│   ├── routes/          # API route definitions
│   ├── controllers/      # Business logic handlers
│   ├── middlewares/      # Auth, validation, error handling
│   ├── utils/           # Helper functions (JWT, bcrypt, etc.)
│   ├── config/          # Database and app configuration
│   └── index.ts         # Express server entry point
├── drizzle/             # Database migrations (auto-generated)
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── drizzle.config.ts    # Drizzle ORM config
└── .env.example         # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL database URL and JWT secret
```

### 3. Start Development Server
```bash
npm run dev
```

The server will run on `http://localhost:5000` with hot reload enabled.

## Features (To Be Implemented)

✅ Step 1: Project setup & folder structure  
⏳ Step 2: Database models (User, Subscription)  
⏳ Step 3: Auth middleware & utilities (JWT, bcrypt)  
⏳ Step 4: Auth routes (Register/Login)  
⏳ Step 5: Subscription management with time-based locks  
⏳ Step 6: Error handling & validation  

## Tech Stack

- **Framework:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** JWT + bcrypt
- **Language:** TypeScript
- **Validation:** Zod
- **CORS:** Configured for frontend
