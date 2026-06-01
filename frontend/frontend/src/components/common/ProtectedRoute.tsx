// Redirects unauthenticated users to /login.
// Wrap any route that requires a logged-in user with this component.
import { Navigate } from "react-router-dom";
import { useAuth } from "../../core/context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  // No token = not logged in → send to login page
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
