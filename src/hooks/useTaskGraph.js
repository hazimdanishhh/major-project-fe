// src/hooks/useTaskGraph.js
//
// Covers: GET /api/projects/:id/task-graph (nodes+edges for one project),
// plus the dependency-edge mutations (POST/DELETE /api/tasks/dependencies*)
// that taskService.js already exposed but no hook consumed until now.
//
// A graph, like the member Kanban board, needs its full task/edge set at
// once rather than a page at a time, so this bypasses usePaginatedQuery
// entirely (same reasoning as useMyTasks() in useTasks.js).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTaskGraph } from "../services/projectService";
import { addDependency, removeDependency } from "../services/taskService";
import { taskKeys } from "./useTasks";
import { useMessage } from "../context/MessageContext";

export const taskGraphKeys = {
  single: (projectId) => ["taskGraph", projectId],
};

// ─── Graph data ────────────────────────────────────────────────────────────────
export function useTaskGraph(projectId) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: taskGraphKeys.single(projectId),
    queryFn: () => fetchTaskGraph(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 30,
  });

  return {
    tasks: data?.tasks ?? [],
    dependencies: data?.dependencies ?? [],
    isLoading,
    isFetching,
    error,
  };
}

// ─── Dependency-edge mutations (pm only) ──────────────────────────────────────
// Adding/removing an edge can flip a task to/from BLOCKED, so both the graph
// query and the blanket task-list key are invalidated on success.
export function useDependencyMutations(projectId) {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: taskGraphKeys.single(projectId) });
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  const addMutation = useMutation({
    mutationFn: addDependency,
    onSuccess: () => {
      invalidateAll();
      showMessage("Dependency added.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const removeMutation = useMutation({
    mutationFn: removeDependency,
    onSuccess: () => {
      invalidateAll();
      showMessage("Dependency removed.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  return {
    addDependency: addMutation.mutateAsync,
    adding: addMutation.isPending,

    removeDependency: removeMutation.mutateAsync,
    removing: removeMutation.isPending,
  };
}
