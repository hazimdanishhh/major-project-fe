// src/services/traceabilityService.js
//
// Covers:
//   GET /api/traceability?project_id=   — Requirements Traceability Matrix
//
// The traceability_matrix is a SQL VIEW in Supabase.
// It joins projects → requirements → tasks in a denormalised flat structure.
// Rows where is_at_risk = true represent "Suspect Links" (Section 7):
// the requirement was edited post-approval, so its linked tasks may be stale.
//
// Critical path is in projectService (GET /api/projects/:id/critical-path)
// because it is scoped to a project, not a standalone traceability concept.

import { apiClient } from "../lib/apiClient";

// ─── Traceability matrix ──────────────────────────────────────────────────────
// Pass project_id to scope the matrix to a single project (recommended).
// Omit it only if you genuinely need a cross-project view.
// Response: { matrix: TraceabilityRow[] }
// TraceabilityRow shape (from the SQL view — adjust if your view differs):
//   { project_id, project_name,
//     requirement_id, requirement_title, requirement_status,
//     task_id, task_title, task_status, task_priority, is_at_risk,
//     is_ai_generated }
export async function fetchTraceabilityMatrix(projectId) {
  const params = new URLSearchParams();
  if (projectId) params.set("project_id", projectId);
  const qs = params.toString();
  return apiClient(`/api/traceability${qs ? `?${qs}` : ""}`);
}
