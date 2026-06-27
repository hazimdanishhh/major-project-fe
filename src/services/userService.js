// src/services/userService.js
//
// Covers:
//   GET /api/auth/users   — list all users for dropdowns (pm + member access)
//
// Used primarily for:
//   - Assigning tasks to team members (assignee_id dropdowns)
//   - Setting client_id when creating a project
//
// Response: { users: UserSummary[] }
// UserSummary shape: { id, full_name, role }

import { apiClient } from "../lib/apiClient";

// ─── List all users ───────────────────────────────────────────────────────────
// Returns all profiles ordered by full_name.
// Accessible to pm and member roles (see authRoutes.js).
export async function fetchUsers() {
  return apiClient("/api/auth/users");
}

// ─── Derived helpers (no extra API calls) ─────────────────────────────────────
// These filter the users array client-side so you don't need separate endpoints.

// All users with role 'client' — for the client_id dropdown when creating a project.
export function filterClients(users = []) {
  return users.filter((u) => u.role === "client");
}

// All users with role 'member' — for task assignee dropdowns.
export function filterMembers(users = []) {
  return users.filter((u) => u.role === "member");
}

// All users with role 'pm' — useful for showing ownership info.
export function filterPMs(users = []) {
  return users.filter((u) => u.role === "pm");
}
