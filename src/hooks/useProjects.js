// src/hooks/useProjects.js
//
// React Query hooks for project data.
// All mutations invalidate ['projects'] so lists stay fresh automatically.
//
// Usage:
//   const { projects, isLoading } = useProjects()
//   const { project, isLoading } = useProject(projectId)
//   const { createProject, creating } = useProjectMutations()

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  archiveProject,
  fetchCriticalPath,
  generateWBSPreview,
  persistWBS,
} from "../services/projectService";
import { useMessage } from "../context/MessageContext";

// ─── Query keys ───────────────────────────────────────────────────────────────
// Centralised here so mutations can invalidate precisely.
export const projectKeys = {
  all: ["projects"],
  single: (id) => ["projects", id],
  criticalPath: (id) => ["projects", id, "critical-path"],
  wbsPreview: (id) => ["projects", id, "wbs-preview"],
};

// ─── List all projects ────────────────────────────────────────────────────────
export function useProjects() {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 2, // 2 min — projects don't change that often
  });

  return {
    projects: data?.projects ?? [],
    isLoading,
    isFetching,
    error,
  };
}

// ─── Single project ───────────────────────────────────────────────────────────
export function useProject(projectId) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: projectKeys.single(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  return {
    project: data?.project ?? null,
    isLoading,
    isFetching,
    error,
  };
}

// ─── Critical path ────────────────────────────────────────────────────────────
export function useCriticalPath(projectId) {
  const { data, isLoading, error } = useQuery({
    queryKey: projectKeys.criticalPath(projectId),
    queryFn: () => fetchCriticalPath(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 30, // CPM is cheap to re-run; 30s is fine
  });

  return {
    schedule: data?.schedule ?? [],
    criticalPath: data?.criticalPath ?? [],
    projectDuration: data?.projectDuration ?? 0,
    isLoading,
    error,
  };
}

// Stable empty reference — WbsReviewPage.jsx compares wbsTasks by identity
// (to detect "a new preview just arrived" without an effect); a `?? []`
// literal would create a new array every render and make that comparison
// never settle, infinite-looping.
const EMPTY_WBS_TASKS = [];

// ─── WBS preview (AI phase 1) ─────────────────────────────────────────────────
// Using useQuery so the preview can be cached and re-read without re-calling the LLM.
// Set enabled: false by default — trigger manually with refetch().
export function useWBSPreview(projectId) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: projectKeys.wbsPreview(projectId),
    queryFn: () => generateWBSPreview(projectId),
    enabled: false, // do NOT auto-fetch; call refetch() from the UI button
    staleTime: Infinity, // the LLM response is fresh until the PM navigates away
    retry: false, // AI errors should surface immediately, not retry silently
  });

  return {
    wbsTasks: data?.tasks ?? EMPTY_WBS_TASKS,
    isGenerating: isLoading || isFetching,
    generateError: error,
    generatePreview: refetch,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useProjectMutations() {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage();

  // ── Create ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showMessage("Project created.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ projectId, updates }) => updateProject(projectId, updates),
    onSuccess: (data) => {
      const id = data?.project?.id;
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      if (id)
        queryClient.invalidateQueries({ queryKey: projectKeys.single(id) });
      showMessage("Project updated.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  // ── Archive ────────────────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: archiveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showMessage("Project archived.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  // ── Persist WBS (AI phase 2) ───────────────────────────────────────────────
  const persistWBSMutation = useMutation({
    mutationFn: ({ projectId, tasks }) => persistWBS(projectId, tasks),
    onSuccess: (data, { projectId }) => {
      // Invalidate tasks and requirements for this project so they refresh
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["requirements"] });
      queryClient.invalidateQueries({
        queryKey: projectKeys.single(projectId),
      });
      showMessage(
        `WBS saved. ${data?.created_task_ids?.length ?? 0} tasks created.`,
        "success",
      );
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  return {
    createProject: createMutation.mutateAsync,
    creating: createMutation.isPending,

    updateProject: updateMutation.mutateAsync,
    updating: updateMutation.isPending,

    archiveProject: archiveMutation.mutateAsync,
    archiving: archiveMutation.isPending,

    persistWBS: persistWBSMutation.mutateAsync,
    persistingWBS: persistWBSMutation.isPending,
  };
}
