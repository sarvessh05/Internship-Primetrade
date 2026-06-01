// Root component — sets up routing and wraps the app in the auth context.
// Add new routes here. All protected routes go inside <ProtectedRoute>.
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./core/context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { getSetupStatus } from "./core/api/auth";
import Loader from "./components/common/Loader";

// Auth pages — accessible without a token
import Login from "./pages/auth/Login";
import AdminRegister from "./pages/auth/AdminRegister";
import EmployeeRegister from "./pages/auth/EmployeeRegister";

// Dashboard — requires a valid JWT
import Dashboard from "./pages/dashboard/Dashboard";

export default function App() {
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    getSetupStatus()
      .then((res) => {
        setAdminExists(res.admin_exists);
      })
      .catch(() => {
        // Fallback to true on network error so we don't lock the user out of login page
        setAdminExists(true);
      });
  }, []);

  if (adminExists === null) {
    return <Loader />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect — if no admin exists, land on admin setup; else landing on '/' goes to dashboard */}
          <Route path="/" element={<Navigate to={adminExists ? "/dashboard" : "/register/admin"} replace />} />

          {/* Public auth routes */}
          <Route path="/login"              element={adminExists ? <Login /> : <Navigate to="/register/admin" replace />} />
          <Route path="/register/admin"     element={!adminExists ? <AdminRegister /> : <Navigate to="/login" replace />} />
          <Route path="/register/employee"  element={adminExists ? <EmployeeRegister /> : <Navigate to="/register/admin" replace />} />

          {/* Protected dashboard — redirects to /login if no token */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Catch-all — unknown URLs go to dashboard (or login if not authenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
