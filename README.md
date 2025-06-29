# Nutrition Tracker App

A comprehensive nutrition tracking application with AI-powered meal analysis, built with Expo React Native and Neon database.

## 🏗️ Architecture

- **Client**: Expo React Native app with TypeScript
- **Database**: Neon PostgreSQL with direct SQL queries
- **Authentication**: JWT with session management
- **AI Integration**: OpenAI GPT-4 Vision for meal analysis

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Neon Database Account**
3. **OpenAI API Key**

### 1. Database Setup (Neon)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string
4. Update `.env` with your database URL

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/nutrition_tracker?sslmode=require"
EXPO_PUBLIC_JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
EXPO_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
```

### 3. Database Schema

Create these tables in your Neon database:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'FREE',
  ai_requests_count INTEGER DEFAULT 0,
  ai_requests_reset_at TIMESTAMP DEFAULT NOW(),
  smart_watch_connected BOOLEAN DEFAULT FALSE,
  smart_watch_type VARCHAR(50),
  meals JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### 4. Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔐 Authentication & Plans

### User Roles & Limits

- **FREE**: 2 AI requests per day
- **PREMIUM**: 50 AI requests per day  
- **GOLD**: Unlimited AI requests

### Sample Users

You can create test accounts through the app or insert them directly:

```sql
-- Free user
INSERT INTO users (email, username, name, password, role) 
VALUES ('free@example.com', 'freeuser', 'Free User', '$2a$12$hashedpassword', 'FREE');

-- Premium user
INSERT INTO users (email, username, name, password, role) 
VALUES ('premium@example.com', 'premiumuser', 'Premium User', '$2a$12$hashedpassword', 'PREMIUM');

-- Gold user
INSERT INTO users (email, username, name, password, role) 
VALUES ('gold@example.com', 'golduser', 'Gold User', '$2a$12$hashedpassword', 'GOLD');
```

## 📱 Features

### Authentication
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Daily AI request limits
- ✅ Secure password hashing
- ✅ Session management

### Nutrition Tracking
- ✅ AI-powered meal analysis
- ✅ Multi-language support (English/Hebrew)
- ✅ Daily nutrition stats
- ✅ Meal history tracking
- ✅ Health score calculation

### User Management
- ✅ Profile management
- ✅ Smart watch connection
- ✅ Plan upgrade system
- ✅ Usage tracking

## 🛠️ Tech Stack

### Frontend
- **Expo** (React Native)
- **TypeScript**
- **Expo Router** (Navigation)
- **AsyncStorage** (Local storage)
- **Lucide React Native** (Icons)

### Backend
- **Expo API Routes**
- **Neon PostgreSQL**
- **JWT** (Authentication)
- **OpenAI API** (Meal analysis)
- **bcryptjs** (Password hashing)

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Direct SQL Queries**: Using @neondatabase/serverless
- **JSON Storage**: Flexible meal data storage

## 📊 API Endpoints

### Authentication
- `POST /auth/signup+api` - Create account
- `POST /auth/signin+api` - Sign in
- `GET /auth/me+api` - Get current user
- `POST /auth/signout+api` - Sign out

### Nutrition
- `POST /nutrition/analyze+api` - Analyze meal image
- `GET /nutrition/meals+api` - Get user meals
- `GET /nutrition/summary+api` - Get daily stats

## 🔄 Daily Reset System

The system automatically resets AI request limits at midnight. You can implement this using a cron job or scheduled function:

```sql
-- Reset all users' daily limits
UPDATE users SET ai_requests_count = 0, ai_requests_reset_at = NOW();
```

## 🚀 Deployment

### Database
1. Your Neon database is already hosted and ready
2. Make sure to set up the schema as shown above

### Client Deployment
1. Build for production: `npm run build:web`
2. Deploy to Netlify, Vercel, or similar
3. Set environment variables in your hosting platform

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build:web    # Build for web
npm run lint         # Run linter
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure your Neon database URL is correct and includes `?sslmode=require`
2. **OpenAI API**: Verify your API key is valid and has credits
3. **Environment Variables**: Make sure all required env vars are set with `EXPO_PUBLIC_` prefix

### Reset Database
```sql
-- Clear all data (be careful!)
TRUNCATE sessions, users RESTART IDENTITY CASCADE;
```

## 📝 License

This project is licensed under the MIT License.