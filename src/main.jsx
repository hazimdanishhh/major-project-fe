// src/main.jsx
//
// Provider order matters:
//   AuthProvider       → must be outermost (everything reads from it)
//   MessageProvider    → global toast system
//   AccessControlProvider → reads AuthContext, must be inside AuthProvider
//
// AccessControlProvider is placed inside AppLayout's route tree (not at root)
// because it only matters for authenticated pages. Public pages (/login, /register)
// don't need it.
//
// Route structure:
//   /login              → PublicRoute → LoginPage
//   /register           → PublicRoute → RegisterPage
//   /pm/*               → ProtectedRoute(pm) → AppLayout → <pm pages>
//   /client/*           → ProtectedRoute(client) → AppLayout → <client pages>
//   /member/*           → ProtectedRoute(member) → AppLayout → <member pages>
//   /                   → redirect to /login
//   *                   → Error404

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.scss";
import "./styles/fonts.scss";
import "./styles/sections.scss";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { MessageProvider } from "./context/MessageContext";
import { AccessControlProvider } from "./context/AccessControlContext";
import { PublicRoute } from "./routes/PublicRoutes";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Error404 from "./pages/error/Error404";
import ProjectsPage from "./pages/authorized/projects/ProjectsPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/reactQuery";
import ProjectDetailPage from "./pages/authorized/projects/detail/ProjectDetailPage";
import ProjectDetailLayout from "./pages/authorized/projects/detail/ProjectDetailLayout";
import TeamPage from "./pages/authorized/team/TeamPage";
import TasksPage from "./pages/authorized/tasks/TasksPage";
import ProjectTasksPage from "./pages/authorized/projects/detail/ProjectTasksPage";
import TaskGraphPage from "./pages/authorized/projects/detail/TaskGraphPage";
import CriticalPathPage from "./pages/authorized/projects/detail/CriticalPathPage";
import WbsReviewPage from "./pages/authorized/projects/detail/WbsReviewPage";
import MemberTasksPage from "./pages/authorized/tasks/MemberTasksPage";
// import ProjectDetailPage from "./pages/authorized/projects/ProjectDetailPage";
// import DashboardPage from "./pages/authorized/dashboard/DashboardPage";
// import TraceabilityPage from "./pages/authorized/traceability/TraceabilityPage";

// ─── Shared authenticated shell ───────────────────────────────────────────────
// AppLayout + AccessControlProvider are shared across all role route trees.
// We define it once so we don't repeat the Provider in every role branch.
function AuthenticatedApp({ allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AccessControlProvider>
        <AppLayout />
      </AccessControlProvider>
    </ProtectedRoute>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MessageProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Root redirect ─────────────────────────────────────────── */}
              <Route index element={<Navigate to="/login" replace />} />

              {/* ── Public pages ──────────────────────────────────────────── */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* ── PM routes ─────────────────────────────────────────────── */}
              <Route
                path="/pm"
                element={<AuthenticatedApp allowedRoles={["pm"]} />}
              >
                <Route index element={<Navigate to="projects" replace />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route
                  path="projects/:projectId"
                  element={<ProjectDetailLayout />}
                >
                  <Route index element={<ProjectDetailPage />} />
                  <Route path="tasks" element={<ProjectTasksPage />} />
                  <Route path="task-graph" element={<TaskGraphPage />} />
                  <Route path="critical-path" element={<CriticalPathPage />} />
                  <Route path="generate-wbs" element={<WbsReviewPage />} />
                </Route>
                <Route path="tasks" element={<TasksPage />} />
                {/* <Route path="traceability" element={<TraceabilityPage />} /> */}
                {/* <Route path="dashboard" element={<DashboardPage />} /> */}
                <Route path="team" element={<TeamPage />} />
                <Route path="*" element={<Error404 />} />
              </Route>

              {/* ── Client routes ─────────────────────────────────────────── */}
              <Route
                path="/client"
                element={<AuthenticatedApp allowedRoles={["client"]} />}
              >
                <Route index element={<Navigate to="projects" replace />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route
                  path="projects/:projectId"
                  element={<ProjectDetailLayout />}
                >
                  <Route index element={<ProjectDetailPage />} />
                </Route>
                <Route path="*" element={<Error404 />} />
              </Route>

              {/* ── Member routes ─────────────────────────────────────────── */}
              <Route
                path="/member"
                element={<AuthenticatedApp allowedRoles={["member"]} />}
              >
                <Route index element={<Navigate to="tasks" replace />} />
                <Route path="tasks" element={<MemberTasksPage />} />
                <Route path="*" element={<Error404 />} />
              </Route>

              {/* ── 404 ───────────────────────────────────────────────────── */}
              <Route path="*" element={<Error404 />} />
            </Routes>
          </BrowserRouter>
        </MessageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
