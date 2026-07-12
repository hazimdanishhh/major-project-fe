// src/services/projectService.js
//
// Covers: GET /api/projects, POST, GET /:id, PATCH /:id, DELETE /:id
//         GET /:id/critical-path
//         GET /:id/task-graph
//         POST /:id/generate-wbs   (AI phase 1 — preview only)
//         POST /:id/persist-wbs    (AI phase 2 — save after PM review)
//
// Response envelopes from the backend:
//   list       → { projects: Project[] }
//   single     → { project: Project }
//   archive    → { message: string, project: Project }
//   cpm        → { schedule: ScheduleEntry[], criticalPath: string[], projectDuration: number }
//   task-graph → { tasks: Task[], dependencies: Dependency[] }  ← raw nodes/edges, no CPM
//   wbs        → { tasks: WBSTask[], message: string }
//   persist    → { message: string, created_task_ids: string[], dependency_count: number }

import { apiClient } from "../lib/apiClient";

// ─── List all projects ────────────────────────────────────────────────────────
// Returns all projects visible to the user.
// Response: { projects: Project[] }
// Project shape: { id, name, description, status, created_at,
//                  owner: { id, full_name, role },
//                  client: { id, full_name, role },
//                  requirement_completion: { total, completed, percentage } }
//                  ↑ Phase 10 — % of this project's requirements that are COMPLETED
// export async function fetchProjects() {
//   return apiClient("/api/projects");
// }
export async function fetchProjects(params) {
  // 1. Create a URL search builder
  const query = new URLSearchParams();

  // 2. Add the top-level parameters
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  if (params.search) query.append("search", params.search);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  // 3. Flatten the nested filters object directly into the URL
  // This ensures your backend sees "?status=ACTIVE" instead of "?filters=[object Object]"
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });
  }

  // 4. Manually append the query string to the URL
  return apiClient(`/api/projects?${query.toString()}`);
}

// ─── Get single project ───────────────────────────────────────────────────────
// Response: { project: Project }  (same shape as list but with all columns)
export async function fetchProject(projectId) {
  return apiClient(`/api/projects/${projectId}`);
}

// ─── Create project (pm only) ─────────────────────────────────────────────────
// Body:     { name: string, description?: string, client_id: uuid }
// Response: { project: Project }
export async function createProject({ name, description, client_id }) {
  return apiClient("/api/projects", {
    method: "POST",
    body: { name, description, client_id },
  });
}

// ─── Update project (pm only) ─────────────────────────────────────────────────
// Body:     { name?, description?, status? }
// status enum: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
// Response: { project: Project }
export async function updateProject(projectId, updates) {
  return apiClient(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: updates,
  });
}

// ─── Archive project (pm only) ────────────────────────────────────────────────
// Soft-delete — sets status to ARCHIVED. Not a real DELETE.
// Response: { message: string, project: Project }
export async function archiveProject(projectId) {
  return apiClient(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

// ─── Critical Path Method (all authenticated users) ───────────────────────────
// Response: {
//   schedule: Array<{ id, title, status, ES, EF, LS, LF, float }>,
//   criticalPath: string[],   ← task IDs on the critical path
//   projectDuration: number   ← total hours
// }
export async function fetchCriticalPath(projectId) {
  return apiClient(`/api/projects/${projectId}/critical-path`);
}

// ─── Task dependency graph (all authenticated users) ──────────────────────────
// Raw nodes/edges for the project's task graph — no CPM computation applied
// (use fetchCriticalPath for that). Response: { tasks: Task[], dependencies:
// Dependency[] }, where Dependency = { task_id, depends_on_task_id, is_ai_generated }.
export async function fetchTaskGraph(projectId) {
  return apiClient(`/api/projects/${projectId}/task-graph`);
}

// ─── AI WBS Generation — Phase 1: Preview (pm only) ──────────────────────────
// Requires: at least one APPROVED requirement with a FINAL specification.
// Returns a preview of AI-generated tasks. Nothing is saved yet.
// The PM reviews/edits this list in the UI before calling persistWBS.
// Response: { tasks: WBSTask[], message: string }
// WBSTask shape: { temp_id, requirement_id, title, description,
//                  estimated_hours, priority, depends_on_temp_ids,
//                  depends_on_existing_task_ids, is_ai_generated }
export async function generateWBSPreview(projectId) {
  return apiClient(`/api/projects/${projectId}/generate-wbs`, {
    method: "POST",
  });
}

// ─── AI WBS Generation — Phase 2: Persist (pm only) ──────────────────────────
// Called after the PM has reviewed and optionally edited the task list.
// Inserts tasks + dependencies, resolves temp_id → real UUID mapping,
// and advances requirements to IMPLEMENTATION status.
// Body: { tasks: WBSTask[] }  ← the (possibly edited) list from generateWBSPreview
// Response: { message, created_task_ids: string[], dependency_count: number }
export async function persistWBS(projectId, tasks) {
  return apiClient(`/api/projects/${projectId}/persist-wbs`, {
    method: "POST",
    body: { tasks },
  });
}
