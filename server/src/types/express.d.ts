// src/types/express.d.ts
import { Request } from "express";

// Define the structure of your user object
interface AuthenticatedUser {
  user_id: string; // Or number, depending on your user ID type
  email: string;
  // Add any other properties you expect on the user object
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser; // Make it optional in case middleware hasn't run or authentication fails
    }
  }
}
