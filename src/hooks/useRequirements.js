import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRequirements,
  createRequirement,
  updateRequirementContent,
  advanceRequirementStatus,
  archiveRequirement,
  createSpec,
  updateSpec,
  fetchRequirementVersions,
  fetchRequirementHistory,
} from "../services/requirementService";
import { useMessage } from "../context/MessageContext";

// ─── Query keys ───────────────────────────────────────────────────────────────
// Centralised here so mutations can invalidate precisely.
export const requirementKeys = {
  all: ["requirements"],
  byProject: (projectId, status) => [
    "requirements",
    "project",
    projectId,
    status ?? null,
  ],
  single: (id) => ["requirements", id],
  versions: (id) => ["requirements", id, "versions"],
  history: (id) => ["requirements", id, "history"],
};

// ─── Requirement FSM (frontend copy — kept in sync by hand with
// major-project-be/src/algorithms.js's REQUIREMENT_TRANSITIONS since the
// two repos share no code). Drives which status-advance button(s) render. ──
export const REQUIREMENT_STATUS_TRANSITIONS = {
  DRAFT: [{ status: "SUBMITTED", label: "Submit", tone: "forward" }],
  SUBMITTED: [
    { status: "UNDER_ANALYSIS", label: "Start Analysis", tone: "forward" },
  ],
  UNDER_ANALYSIS: [
    {
      status: "SPECIFICATION_DRAFTED",
      label: "Mark Specs Drafted",
      tone: "forward",
    },
  ],
  SPECIFICATION_DRAFTED: [
    {
      status: "CLIENT_VALIDATION",
      label: "Send for Client Validation",
      tone: "forward",
    },
  ],
  CLIENT_VALIDATION: [
    { status: "APPROVED", label: "Approve", tone: "forward" },
    { status: "UNDER_ANALYSIS", label: "Send Back to Analysis", tone: "revert" },
  ],
  APPROVED: [
    { status: "IMPLEMENTATION", label: "Start Implementation", tone: "forward" },
    { status: "UNDER_ANALYSIS", label: "Send Back to Analysis", tone: "revert" },
  ],
  IMPLEMENTATION: [
    { status: "COMPLETED", label: "Mark Complete", tone: "forward" },
  ],
  COMPLETED: [],
};

// Requirement statuses a specification can be created/edited in — mirrors
// the backend's SPEC_ALLOWED_STATUSES in requirementController.js.
export const SPEC_ALLOWED_STATUSES = ["UNDER_ANALYSIS", "SPECIFICATION_DRAFTED"];

// ─── List requirements for a project ──────────────────────────────────────────
export function useRequirements({ projectId, status } = {}) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: requirementKeys.byProject(projectId, status),
    queryFn: () => fetchRequirements({ project_id: projectId, status }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    requirements: data?.requirements ?? [],
    isLoading,
    isFetching,
    error,
  };
}

// ─── Version history ───────────────────────────────────────────────────────────
// Fetched on demand (pass enabled: false until the history panel is opened) —
// not needed on initial page load for every requirement card.
export function useRequirementVersions(requirementId, { enabled = true } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: requirementKeys.versions(requirementId),
    queryFn: () => fetchRequirementVersions(requirementId),
    enabled: !!requirementId && enabled,
  });

  return { versions: data?.versions ?? [], isLoading };
}

// ─── Status change (FSM) history ────────────────────────────────────────────────
export function useRequirementHistory(requirementId, { enabled = true } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: requirementKeys.history(requirementId),
    queryFn: () => fetchRequirementHistory(requirementId),
    enabled: !!requirementId && enabled,
  });

  return { history: data?.history ?? [], isLoading };
}

// ─── Mutations ────────────────────────────────────────────────────────────────
// All mutations invalidate the blanket ["requirements"] prefix (matches the
// precedent already set by useProjectMutations's persistWBS mutation) so
// every cached byProject(...)/single(...) query refreshes regardless of
// which status filter it was fetched with.
export function useRequirementMutations() {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage();

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: requirementKeys.all });

  const createMutation = useMutation({
    mutationFn: createRequirement,
    onSuccess: () => {
      invalidateAll();
      showMessage("Requirement created.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ requirementId, updates }) =>
      updateRequirementContent(requirementId, updates),
    onSuccess: () => {
      invalidateAll();
      showMessage("Requirement updated.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const advanceStatusMutation = useMutation({
    mutationFn: ({ requirementId, newStatus }) =>
      advanceRequirementStatus(requirementId, newStatus),
    onSuccess: (data) => {
      invalidateAll();
      showMessage(`Status changed to ${data.requirement.status}.`, "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveRequirement,
    onSuccess: () => {
      invalidateAll();
      showMessage("Requirement archived.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const createSpecMutation = useMutation({
    mutationFn: ({ requirementId, specData }) =>
      createSpec(requirementId, specData),
    onSuccess: () => {
      invalidateAll();
      showMessage("Specification added.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const updateSpecMutation = useMutation({
    mutationFn: ({ requirementId, specId, updates }) =>
      updateSpec(requirementId, specId, updates),
    onSuccess: () => {
      invalidateAll();
      showMessage("Specification updated.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  return {
    createRequirement: createMutation.mutateAsync,
    creating: createMutation.isPending,

    updateRequirementContent: updateContentMutation.mutateAsync,
    updatingContent: updateContentMutation.isPending,

    advanceRequirementStatus: advanceStatusMutation.mutateAsync,
    advancingStatus: advanceStatusMutation.isPending,

    archiveRequirement: archiveMutation.mutateAsync,
    archiving: archiveMutation.isPending,

    createSpec: createSpecMutation.mutateAsync,
    creatingSpec: createSpecMutation.isPending,

    updateSpec: updateSpecMutation.mutateAsync,
    updatingSpec: updateSpecMutation.isPending,
  };
}
