
# Frontend API Client

This folder contains TypeScript API clients that match your backend route controllers. Each file corresponds to a route controller and provides type-safe methods for frontend integration.

## Structure

- `auth.ts` - Authentication API methods (signup, signin, getMe, signout)
- `nutrition.ts` - Nutrition analysis API methods (analyzeMeal, getMeals, getDailyStats)
- `user.ts` - User management API methods (updateProfile, getSubscriptionInfo)
- `index.ts` - Main export file for easy imports

## Usage

```typescript
import { AuthAPI, NutritionAPI, UserAPI } from './api';

// Authentication
const authResult = await AuthAPI.signIn({ email, password });

// Nutrition analysis
const mealResult = await NutritionAPI.analyzeMeal(token, { imageBase64, language });

// User profile
const profileResult = await UserAPI.updateProfile(token, { name: 'New Name' });
```

## Environment Variables

Make sure to set `REACT_APP_API_URL` in your frontend environment:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Types

All API methods include comprehensive TypeScript types for request and response data, ensuring type safety throughout your frontend application.
