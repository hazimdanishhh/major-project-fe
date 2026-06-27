// src/routes/PublicRoutes.jsx
//
// Wraps public pages (/login, /register).
// If the user is already logged in, redirect them to their role's home page
// instead of showing the login/register form again.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME } from "../data/sideNavConfig";

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
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

  // Already logged in → go to their dashboard
  if (user) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/login"} replace />;
  }

  return children;
}
