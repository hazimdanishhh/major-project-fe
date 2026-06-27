// src/services/requirementService.js
//
// Hierarchy: Project → Requirement → Specification
//
// Covers:
//   GET    /api/requirements?project_id=&status=
//   POST   /api/requirements
//   GET    /api/requirements/:id              (includes specs + tasks inline)
//   PATCH  /api/requirements/:id             (content edit OR FSM status advance — never both)
//   DELETE /api/requirements/:id             (soft-delete → COMPLETED, pm only)
//
//   GET    /api/requirements/:id/versions    (version history, newest first)
//   GET    /api/requirements/:id/history     (FSM audit trail, newest first)
//
//   POST   /api/requirements/:id/specs
//   PATCH  /api/requirements/:id/specs/:spec_id
//
// ─── Requirement FSM ──────────────────────────────────────────────────────────
// DRAFT → SUBMITTED → UNDER_ANALYSIS → SPECIFICATION_DRAFTED
//   → CLIENT_VALIDATION → APPROVED → IMPLEMENTATION → COMPLETED
//
// Important backend rules:
//   - Content edits (title/description) and status advances must be separate PATCH calls.
//   - Content edits while status is APPROVED or IMPLEMENTATION auto-revert to UNDER_ANALYSIS,
//     bump the version, and flag all linked tasks as is_at_risk = true.
//   - Specs can only be created/updated while status is UNDER_ANALYSIS or SPECIFICATION_DRAFTED.

import { apiClient } from "../lib/apiClient";

// ─── List requirements ────────────────────────────────────────────────────────
// Always pass project_id — listing all requirements across all projects is rarely useful.
// Optional status filter for Kanban-style views.
// Response: { requirements: Requirement[] }
// Requirement list shape: { id, title, description, status, current_version,
//                           created_at, updated_at,
//                           created_by: { id, full_name } }
export async function fetchRequirements({ project_id, status } = {}) {
  const params = new URLSearchParams();
  if (project_id) params.set("project_id", project_id);
  if (status) params.set("status", status);
  const qs = params.toString();
  return apiClient(`/api/requirements${qs ? `?${qs}` : ""}`);
}

// ─── Get single requirement ───────────────────────────────────────────────────
// Returns the full requirement with nested specs and task summaries.
// Response: { requirement: RequirementDetail }
// RequirementDetail adds:
//   created_by_user: { id, full_name }
//   requirement_specifications: Spec[]
//   tasks: Array<{ id, title, status, is_at_risk, is_ai_generated,
//                  assignee: { id, full_name } }>
export async function fetchRequirement(requirementId) {
  return apiClient(`/api/requirements/${requirementId}`);
}

// ─── Create requirement (pm, client) ──────────────────────────────────────────
// Starts in DRAFT status. Version 1 is recorded automatically.
// Body:     { project_id: uuid, title: string, description?: string }
// Response: { requirement: Requirement }
export async function createRequirement({ project_id, title, description }) {
  return apiClient("/api/requirements", {
    method: "POST",
    body: { project_id, title, description },
  });
}

// ─── Update requirement content (pm, client) ──────────────────────────────────
// Use this for editing title/description only.
// Do NOT include new_status here — use advanceRequirementStatus() for that.
// Body:     { title?: string, description?: string }
// Response: { requirement: Requirement }
//
// Side effects the backend handles automatically:
//   - If status is APPROVED or IMPLEMENTATION: reverts to UNDER_ANALYSIS,
//     bumps current_version, flags linked tasks as is_at_risk.
//   - If status is DRAFT/SUBMITTED/etc.: updates content only.
export async function updateRequirementContent(
  requirementId,
  { title, description },
) {
  return apiClient(`/api/requirements/${requirementId}`, {
    method: "PATCH",
    body: { title, description },
  });
}

// ─── Advance FSM status (pm, client) ─────────────────────────────────────────
// Use this for status transitions only. Do NOT mix with content edits.
// Body:     { new_status: RequirementStatus }
// Response: { requirement: Requirement }
//
// Valid transitions:
//   DRAFT → SUBMITTED
//   SUBMITTED → UNDER_ANALYSIS
//   UNDER_ANALYSIS → SPECIFICATION_DRAFTED
//   SPECIFICATION_DRAFTED → CLIENT_VALIDATION
//   CLIENT_VALIDATION → APPROVED | UNDER_ANALYSIS
//   APPROVED → IMPLEMENTATION | UNDER_ANALYSIS
//   IMPLEMENTATION → COMPLETED
export async function advanceRequirementStatus(requirementId, new_status) {
  return apiClient(`/api/requirements/${requirementId}`, {
    method: "PATCH",
    body: { new_status },
  });
}

// ─── Archive requirement (pm only) ───────────────────────────────────────────
// Soft-delete: sets status to COMPLETED and deprecates all linked tasks.
// The audit trail is preserved. Active views should filter status != COMPLETED.
// Response: { message: string, requirement: Requirement }
export async function archiveRequirement(requirementId) {
  return apiClient(`/api/requirements/${requirementId}`, {
    method: "DELETE",
  });
}

// ─── Version history ──────────────────────────────────────────────────────────
// Returns every saved version of the requirement content, newest first.
// A new version is only created on content edits when status is APPROVED/IMPLEMENTATION.
// Response: { versions: Version[] }
// Version shape: { id, requirement_id, version_no, title, description,
//                  changed_at, changed_by_user: { id, full_name } }
export async function fetchRequirementVersions(requirementId) {
  return apiClient(`/api/requirements/${requirementId}/versions`);
}

// ─── FSM audit trail ──────────────────────────────────────────────────────────
// Returns every status transition for this requirement, newest first.
// Response: { history: StatusHistoryEntry[] }
// StatusHistoryEntry: { id, requirement_id, old_status, new_status,
//                       changed_at, changed_by_user: { id, full_name } }
export async function fetchRequirementHistory(requirementId) {
  return apiClient(`/api/requirements/${requirementId}/history`);
}

// ─── Create specification (pm only) ──────────────────────────────────────────
// Only allowed when requirement status is UNDER_ANALYSIS or SPECIFICATION_DRAFTED.
// Body: { description: string, title?: string, acceptance_criteria?: string,
//          complexity_score?: number (0-10), status?: 'DRAFT' | 'FINAL' }
// Response: { spec: Spec }
// Spec shape: { id, requirement_id, title, description, acceptance_criteria,
//               complexity_score, status, created_at, updated_at, created_by }
export async function createSpec(requirementId, specData) {
  return apiClient(`/api/requirements/${requirementId}/specs`, {
    method: "POST",
    body: specData,
  });
}

// ─── Update specification (pm only) ──────────────────────────────────────────
// Only allowed when requirement status is UNDER_ANALYSIS or SPECIFICATION_DRAFTED.
// Body: any subset of { title, description, acceptance_criteria,
//                       complexity_score, status }
// Response: { spec: Spec }
export async function updateSpec(requirementId, specId, updates) {
  return apiClient(`/api/requirements/${requirementId}/specs/${specId}`, {
    method: "PATCH",
    body: updates,
  });
}
