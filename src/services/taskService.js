// src/services/taskService.js
//
// Covers:
//   GET    /api/tasks?requirement_id=&status=&assignee_id=&is_at_risk=
//   POST   /api/tasks                    (pm only)
//   GET    /api/tasks/:id
//   PATCH  /api/tasks/:id                (pm, member — metadata only)
//   PATCH  /api/tasks/:id/status         (all authenticated — triggers BFS)
//   DELETE /api/tasks/:id                (pm only — soft-delete)
//
//   GET    /api/tasks/:id/dependencies
//   POST   /api/tasks/dependencies       (pm only — DFS cycle check inside)
//   DELETE /api/tasks/dependencies/:task_id/:depends_on_task_id  (pm only)
//
// ─── Task status FSM ─────────────────────────────────────────────────────────
//   TO_DO → IN_PROGRESS → DONE          (normal flow)
//   any → CANCELLED                     (terminal)
//   BLOCKED → TO_DO (auto, via BFS when all parents complete)
//   DONE and CANCELLED are terminal — cannot be reversed.
//   BLOCKED tasks cannot be manually moved to IN_PROGRESS or DONE.
//
// ─── Dependency side effects ──────────────────────────────────────────────────
//   Adding a dependency where the parent is not DONE auto-BLOCKs the child.
//   Removing a dependency re-evaluates the child: if all remaining parents are
//   DONE (or no parents remain), the child is auto-moved to TO_DO.
//   Completing a task (DONE) triggers BFS: direct children whose remaining
//   parents are all DONE are auto-unblocked to TO_DO.

import { apiClient } from "../lib/apiClient";

// ─── List tasks ───────────────────────────────────────────────────────────────
// All filters are optional but requirement_id is the most common.
// Response: { tasks: Task[] }
// Task list shape: { id, title, description, status, priority, estimated_hours,
//                    is_at_risk, is_deprecated, is_ai_generated,
//                    created_at, updated_at,
//                    assignee: { id, full_name },
//                    requirement: { id, title, project_id } }
export async function fetchTasks({
  requirement_id,
  status,
  assignee_id,
  is_at_risk,
} = {}) {
  const params = new URLSearchParams();
  if (requirement_id) params.set("requirement_id", requirement_id);
  if (status) params.set("status", status);
  if (assignee_id) params.set("assignee_id", assignee_id);
  if (is_at_risk !== undefined) params.set("is_at_risk", String(is_at_risk));
  const qs = params.toString();
  return apiClient(`/api/tasks${qs ? `?${qs}` : ""}`);
}

// ─── Get single task ──────────────────────────────────────────────────────────
// Response: { task: TaskDetail }
// TaskDetail adds: assignee: { id, full_name },
//                  requirement: { id, title, project_id, status }
export async function fetchTask(taskId) {
  return apiClient(`/api/tasks/${taskId}`);
}

// ─── Create task (pm only) ────────────────────────────────────────────────────
// New tasks always start as TO_DO. is_ai_generated is set to false.
// Body: { requirement_id: uuid, title: string, description?: string,
//          assignee_id?: uuid, estimated_hours?: number,
//          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }
// Response: { task: Task }
export async function createTask({
  requirement_id,
  title,
  description,
  assignee_id,
  estimated_hours,
  priority,
}) {
  return apiClient("/api/tasks", {
    method: "POST",
    body: {
      requirement_id,
      title,
      description,
      assignee_id: assignee_id ?? null,
      estimated_hours,
      priority,
    },
  });
}

// ─── Update task metadata (pm, member) ───────────────────────────────────────
// For editing title, description, assignee, hours, priority, or is_at_risk.
// Does NOT change status — use updateTaskStatus() for that.
// Body: any subset of { title, description, assignee_id, estimated_hours,
//                       priority, is_at_risk }
// Response: { task: Task }
export async function updateTask(taskId, updates) {
  return apiClient(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: updates,
  });
}

// ─── Update task status (all authenticated) ───────────────────────────────────
// Triggers BFS workflow automation when status === 'DONE':
// direct children whose remaining parents are all DONE are auto-unblocked.
// Body:     { status: TaskStatus }
// Response: { task: Task, unblocked: string[] }
//   unblocked = array of task IDs that were automatically moved to TO_DO
export async function updateTaskStatus(taskId, status) {
  return apiClient(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

// ─── Deprecate task (pm only) ─────────────────────────────────────────────────
// Soft-delete: sets is_deprecated = true. Task is excluded from future queries.
// Response: { message: string }
export async function deprecateTask(taskId) {
  return apiClient(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// ─── List dependencies for a task ─────────────────────────────────────────────
// Returns all edges where this task is either the dependent or the dependency.
// Response: { dependencies: Dependency[] }
// Dependency shape: { task_id, depends_on_task_id, is_ai_generated,
//                     task: { id, title, status },
//                     depends_on: { id, title, status } }
export async function fetchTaskDependencies(taskId) {
  return apiClient(`/api/tasks/${taskId}/dependencies`);
}

// ─── Add dependency (pm only) ─────────────────────────────────────────────────
// The backend runs DFS cycle detection before inserting.
// If the parent is not DONE, the child task is auto-BLOCKed.
// Body:     { task_id: uuid, depends_on_task_id: uuid }
// Response: { dependency: Dependency }
// Errors:   400 if would create a cycle or self-dependency
//           409 if the dependency already exists
export async function addDependency({ task_id, depends_on_task_id }) {
  return apiClient("/api/tasks/dependencies", {
    method: "POST",
    body: { task_id, depends_on_task_id },
  });
}

// ─── Remove dependency (pm only) ──────────────────────────────────────────────
// After removal, the backend re-evaluates the child:
// if all remaining parents are DONE (or no parents left), child → TO_DO.
// Response: { message: string }
export async function removeDependency({ task_id, depends_on_task_id }) {
  return apiClient(`/api/tasks/dependencies/${task_id}/${depends_on_task_id}`, {
    method: "DELETE",
  });
}
