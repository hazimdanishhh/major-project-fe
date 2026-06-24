import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.scss";
import "./styles/fonts.scss";
import "./styles/sections.scss";
import Error404 from "./pages/error/Error404";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import { PublicRoute } from "./routes/PublicRoutes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProjectsPage from "./pages/authorized/projects/ProjectsPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { MessageProvider } from "./context/MessageContext";
import AppLayout from "./layout/AppLayout";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <MessageProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route index element={<Navigate to="/login" replace />} />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* PM */}
            {/* <Route path="/pm/*" element={
        <ProtectedRoute allowedRoles={['pm']}>
          <ProjectManagerRoutes />
        </ProtectedRoute>
      } /> */}
            <Route
              path="/pm/*"
              element={
                <ProtectedRoute allowedRoles={["pm"]}>
                  <AppLayout>
                    <ProjectsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Client */}
            {/* <Route path="/client/*" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientRoutes />
        </ProtectedRoute>
      } /> */}

            {/* Member */}
            {/* <Route path="/member/*" element={
        <ProtectedRoute allowedRoles={['member']}>
          <MemberRoutes />
        </ProtectedRoute>
      } /> */}

            <Route path="*" element={<Error404 />} />
          </Routes>
        </BrowserRouter>
      </MessageProvider>
    </AuthProvider>
  </StrictMode>,
);
