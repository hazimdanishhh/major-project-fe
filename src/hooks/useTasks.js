// src/hooks/useTasks.js
//
// Covers: task list (paginated + unpaginated), task mutations, and the
// task status FSM used by both the list pages' status-change buttons and
// the member Kanban board.
//
// GET /api/tasks has no pagination and no project_id filter — only
// requirement_id/status/assignee_id/is_at_risk. taskListQueryFn() below is
// an adapter that forwards those to the server, then applies search/priority/
// project scoping and pagination client-side, so it can slot straight into
// usePaginatedQuery's { data, totalCount } contract and reuse the same
// SearchFilterBar/ActiveFiltersBar/SortBar/PageResult UI as ProjectsPage.jsx.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deprecateTask,
} from "../services/taskService";
import { useMessage } from "../context/MessageContext";

// ─── Query keys ───────────────────────────────────────────────────────────────
export const taskKeys = {
  all: ["tasks"],
  list: (params) => ["tasks", "list", params],
  single: (id) => ["tasks", id],
};

// ─── Task status FSM (frontend copy — kept in sync by hand with
// major-project-be/src/controllers/taskController.js's updateTaskStatus guards
// since the two repos share no code). Drives which status-change button(s)
// render on a task card. Deliberately narrower than "everything the server
// technically allows": BLOCKED->TO_DO is left out even though the server
// doesn't guard it, because that transition belongs to the BFS auto-unblock
// workflow, not a manual UI action. ──
export const TASK_STATUS_TRANSITIONS = {
  BLOCKED: [{ status: "CANCELLED", label: "Cancel", tone: "revert" }],
  TO_DO: [
    { status: "IN_PROGRESS", label: "Start", tone: "forward" },
    { status: "CANCELLED", label: "Cancel", tone: "revert" },
  ],
  IN_PROGRESS: [
    { status: "DONE", label: "Complete", tone: "forward" },
    { status: "CANCELLED", label: "Cancel", tone: "revert" },
  ],
  DONE: [],
  CANCELLED: [],
};

// Kanban column order + labels — also used for status sort comparisons.
export const KANBAN_COLUMNS = [
  { status: "BLOCKED", label: "Blocked" },
  { status: "TO_DO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
  { status: "CANCELLED", label: "Cancelled" },
];

const STATUS_ORDER = Object.fromEntries(
  KANBAN_COLUMNS.map((c, i) => [c.status, i]),
);

const PRIORITY_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

// ─── Paginated list adapter ───────────────────────────────────────────────────
// Conforms to usePaginatedQuery's queryFn({page,pageSize,search,filters,
// sortBy,sortOrder,...extraParams}) -> {data, totalCount} contract.
// extraParams.projectId (optional) scopes the result to one project, since
// the backend has no project_id filter — used by ProjectTasksPage.
export async function taskListQueryFn({
  page,
  pageSize,
  search,
  filters = {},
  sortBy,
  sortOrder,
  projectId,
}) {
  const { tasks } = await fetchTasks({
    status: filters.status || undefined,
    assignee_id: filters.assignee_id || undefined,
    is_at_risk: filters.is_at_risk || undefined,
  });

  let result = tasks;

  if (projectId) {
    result = result.filter((t) => t.requirement?.project_id === projectId);
  }
  if (filters.project_id) {
    result = result.filter(
      (t) => t.requirement?.project_id === filters.project_id,
    );
  }
  if (filters.requirement_id) {
    result = result.filter((t) => t.requirement?.id === filters.requirement_id);
  }
  if (filters.priority) {
    result = result.filter((t) => t.priority === filters.priority);
  }
  if (search) {
    const term = search.toLowerCase();
    result = result.filter((t) => (t.title || "").toLowerCase().includes(term));
  }

  result = [...result].sort((a, b) => {
    let diff;
    if (sortBy === "priority") {
      diff = (PRIORITY_ORDER[a.priority] ?? -1) - (PRIORITY_ORDER[b.priority] ?? -1);
    } else if (sortBy === "status") {
      diff = (STATUS_ORDER[a.status] ?? -1) - (STATUS_ORDER[b.status] ?? -1);
    } else if (sortBy === "estimated_hours") {
      diff = (a.estimated_hours ?? 0) - (b.estimated_hours ?? 0);
    } else if (sortBy === "title") {
      diff = (a.title || "").localeCompare(b.title || "");
    } else {
      diff = new Date(a.created_at) - new Date(b.created_at);
    }
    return sortOrder === "descending" ? -diff : diff;
  });

  const totalCount = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, totalCount };
}

// ─── Unpaginated list — member Kanban board ───────────────────────────────────
// A board needs its full task set at once (columns aren't pages), so this
// bypasses usePaginatedQuery entirely rather than forcing a page-size fit.
export function useMyTasks(assigneeId) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: taskKeys.list({ assignee_id: assigneeId }),
    queryFn: () => fetchTasks({ assignee_id: assigneeId }),
    enabled: !!assigneeId,
    staleTime: 1000 * 30,
  });

  return {
    tasks: data?.tasks ?? [],
    isLoading,
    isFetching,
    error,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage();

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: taskKeys.all });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      invalidateAll();
      showMessage("Task created.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }) => updateTask(taskId, updates),
    onSuccess: () => {
      invalidateAll();
      showMessage("Task updated.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => updateTaskStatus(taskId, status),
    onSuccess: (data) => {
      invalidateAll();
      showMessage(`Status changed to ${data.task.status}.`, "success");
      if (data.unblocked?.length > 0) {
        showMessage(
          `${data.unblocked.length} dependent task(s) unblocked.`,
          "info",
        );
      }
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  const deprecateMutation = useMutation({
    mutationFn: deprecateTask,
    onSuccess: () => {
      invalidateAll();
      showMessage("Task deprecated.", "success");
    },
    onError: (err) => showMessage(err.message, "error"),
  });

  return {
    createTask: createMutation.mutateAsync,
    creating: createMutation.isPending,

    updateTask: updateMutation.mutateAsync,
    updating: updateMutation.isPending,

    updateTaskStatus: updateStatusMutation.mutateAsync,
    updatingStatus: updateStatusMutation.isPending,

    deprecateTask: deprecateMutation.mutateAsync,
    deprecating: deprecateMutation.isPending,
  };
}
