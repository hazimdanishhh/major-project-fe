// src/routes/ProtectedRoute.jsx
//
// Usage:
//   <ProtectedRoute>                        ← any logged-in user
//   <ProtectedRoute allowedRoles={['pm']}>  ← pm only
//
// Renders a loading state while AuthContext is initialising (prevents
// redirect flicker on page refresh for already-logged-in users).

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../data/sideNavConfig";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Keep this simple — your global spinner/skeleton can replace this
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  // Not logged in → send to login, remember where they were going
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in but wrong role → send to their own home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
  }

  return children;
}
