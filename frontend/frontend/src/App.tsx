// Root component — sets up routing and wraps the app in the auth context.
// Add new routes here. All protected routes go inside <ProtectedRoute>.
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./core/context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth pages — accessible without a token
import Login from "./pages/auth/Login";
import AdminRegister from "./pages/auth/AdminRegister";
import EmployeeRegister from "./pages/auth/EmployeeRegister";

// Dashboard — requires a valid JWT
import Dashboard from "./pages/dashboard/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect — logged-in users land on the dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public auth routes */}
          <Route path="/login"              element={<Login />} />
          <Route path="/register/admin"     element={<AdminRegister />} />
          <Route path="/register/employee"  element={<EmployeeRegister />} />

          {/* Protected dashboard — redirects to /login if no token */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Catch-all — unknown URLs go to dashboard (or login if not authenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
