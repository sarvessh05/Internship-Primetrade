// Auth API calls — used by login, register, and invite flows
import api from "./client";

// Shared User type used across the whole app
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  is_active: boolean;
}

export interface AuthResponse { token: string; user: User; }

// One-time admin setup — allowed only if no admin exists
export const registerAdmin = (name: string, email: string, password: string) =>
  api.post("/auth/register/admin", { name, email, password }).then(r => r.data.data as User);

// Employee completes registration using the invite token from their link
export const registerEmployee = (name: string, password: string, token: string) =>
  api.post("/auth/register/employee", { name, password, token }).then(r => r.data.data as User);

// Login works for both admins and employees
export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password }).then(r => r.data.data as AuthResponse);

// Returns the currently logged-in user's profile
export const getMe = () =>
  api.get("/auth/me").then(r => r.data.data as User);

// Admin sends an invite — returns the token to share with the employee
export const inviteEmployee = (email: string) =>
  api.post("/auth/invite", { email }).then(r => r.data.data as { token: string; email: string });
