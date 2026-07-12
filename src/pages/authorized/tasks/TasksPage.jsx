// src/pages/authorized/tasks/TasksPage.jsx
//
// PM-only cross-project "All Tasks" list (/pm/tasks). Not a board — see
// MemberTasksPage.jsx for the Kanban view. Reuses the same list/pagination
// shell as ProjectsPage.jsx (the reference implementation for this pattern).

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PencilSimpleIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { useAccessControl } from "../../../context/AccessControlContext";
import { useMessage } from "../../../context/MessageContext";

// --- Hooks & Services ---
import usePaginatedQuery from "../../../hooks/usePaginatedQuery";
import { taskListQueryFn, useTaskMutations } from "../../../hooks/useTasks";
import { fetchProjects } from "../../../services/projectService";

// --- Components ---
import Button from "../../../components/buttons/button/Button";
import CardLayout from "../../../components/cardLayout/CardLayout";
import ActiveFiltersBar from "../../../components/crud/activeFiltersBar/ActiveFiltersBar";
import DataSidebar from "../../../components/dataSidebar/DataSidebar";
import NoResult from "../../../components/crud/noResult/NoResult";
import PageHeader from "../../../components/crud/pageHeader/PageHeader";
import PageResult from "../../../components/crud/pageResult/PageResult";
import SearchFilterBar from "../../../components/crud/searchFilterBar/SearchFilterBar";
import SortBar from "../../../components/crud/sortBar/SortBar";
import LoadingIcon from "../../../components/loadingIcon/LoadingIcon";
import ActionModal from "../../../components/modals/actionModal/ActionModal";
import TaskCard from "../../../components/tasks/taskCard/TaskCard";
import { getTaskColumns } from "./config/taskFormConfig";
import { getFilterConfig } from "./config/taskFilterConfig";
import { getSortConfig } from "./config/taskSortConfig";

export default function TasksPage() {
  const { canAccess } = useAccessControl();
  const { showMessage } = useMessage();
  const {
    createTask,
    creating,
    updateTask,
    updating,
    updateTaskStatus,
    updatingStatus,
    deprecateTask,
    deprecating,
  } = useTaskMutations();

  // { mode: "create" | "edit", task: {} | taskRow }
  const [taskSidebar, setTaskSidebar] = useState(null);
  // { task: taskRow, transition: { status, label, tone } }
  const [statusModal, setStatusModal] = useState(null);

  // =========================
  // DATA FETCHING
  // =========================
  const {
    data: tasks,
    totalCount,
    page,
    totalPages,
    search,
    filters,
    sortBy,
    sortOrder,
    activeFilters,
    hasActiveFilters,
    setPage,
    setSearch,
    setFilters,
    setSortBy,
    setSortOrder,
    resetParams,
    isLoading,
    isFetching,
    error,
  } = usePaginatedQuery({
    queryKey: "tasks",
    queryFn: taskListQueryFn,
    pageSize: 20,
    defaultSortBy: "created_at",
    defaultSortOrder: "descending",
  });

  // The task list response only embeds { id, title, project_id } on
  // `requirement` — no project name — so project names are resolved here
  // once via a small lookup map rather than per-card network calls.
  const { data: projectsResp } = useQuery({
    queryKey: ["projects", "lookup"],
    queryFn: () => fetchProjects({ page: 1, pageSize: 100 }),
    staleTime: 1000 * 60 * 2,
  });
  const projectsById = useMemo(() => {
    return Object.fromEntries(
      (projectsResp?.data ?? []).map((p) => [p.id, p.name]),
    );
  }, [projectsResp]);

  // CONFIG
  const filterConfig = getFilterConfig({ scope: "all", showMessage });
  const sortConfig = getSortConfig();

  const hasData = tasks?.length > 0;

  async function handleSaveTask(formData) {
    const payload = {
      title: formData.title,
      description: formData.description || undefined,
      assignee_id: formData.assignee_id?.value ?? null,
      estimated_hours:
        formData.estimated_hours === "" || formData.estimated_hours == null
          ? undefined
          : Number(formData.estimated_hours),
      priority: formData.priority || undefined,
    };

    if (taskSidebar.mode === "create") {
      await createTask({
        requirement_id: formData.requirement_id?.value,
        ...payload,
      });
    } else {
      await updateTask({
        taskId: taskSidebar.task.id,
        updates: { ...payload, is_at_risk: formData.is_at_risk === "true" },
      });
    }
    setTaskSidebar(null);
  }

  async function handleDeprecateTask() {
    await deprecateTask(taskSidebar.task.id);
    setTaskSidebar(null);
  }

  async function handleConfirmStatusChange() {
    await updateTaskStatus({
      taskId: statusModal.task.id,
      status: statusModal.transition.status,
    });
    setStatusModal(null);
  }

  return (
    <div className="pageLayout">
      {/* ── 1. Page Header & Actions ───────────────────────────────────── */}
      <PageHeader>
        <div>
          <h1 className="textL textBold">All Tasks</h1>
          <p className="textXXS textLight">
            Tasks across all of your projects.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <SortBar
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOptions={sortConfig}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {canAccess({ roles: ["pm"] }) && (
            <Button
              style="button buttonType5 approval textXXS"
              onClick={() => setTaskSidebar({ mode: "create", task: {} })}
              name="New Task"
              icon2={PlusCircleIcon}
              weight="fill"
            />
          )}
        </div>
      </PageHeader>

      {/* ── 2. Search & Filter Bar ──────────────────────────────────────── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        filterConfig={filterConfig}
        placeholder="Search tasks..."
      />

      {/* ── 3. Active Filters ────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <ActiveFiltersBar
          search={search}
          setSearch={setSearch}
          filters={activeFilters}
          setFilters={setFilters}
          filterConfig={filterConfig}
          resetParams={resetParams}
        />
      )}

      {/* ── 4. Pagination / Result Counter ──────────────────────────────── */}
      <PageResult
        data={tasks}
        totalCount={totalCount}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        error={error}
      />

      {/* ── 5. Main Data Display ────────────────────────────────────────── */}
      <CardLayout style="cardWrapperScroll generalCard">
        {isLoading || isFetching ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : error ? (
          <NoResult title="Error loading tasks" />
        ) : !hasData ? (
          <NoResult title="No tasks found." />
        ) : (
          <CardLayout style="cardLayout1 cardGapSmall cardPaddingSmall">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectsById[task.requirement?.project_id]}
                onEdit={() => setTaskSidebar({ mode: "edit", task })}
                onTransitionClick={(transition) =>
                  setStatusModal({ task, transition })
                }
              />
            ))}
          </CardLayout>
        )}
      </CardLayout>

      {taskSidebar && (
        <DataSidebar
          title={taskSidebar.mode === "create" ? "New Task" : "Edit Task"}
          icon={
            taskSidebar.mode === "create" ? PlusCircleIcon : PencilSimpleIcon
          }
          open
          onClose={() => setTaskSidebar(null)}
          rowData={taskSidebar.task}
          columns={getTaskColumns({
            showMessage,
            isEditing: taskSidebar.mode === "edit",
          })}
          onSave={handleSaveTask}
          onDelete={
            canAccess({ roles: ["pm"] }) && taskSidebar.mode === "edit"
              ? handleDeprecateTask
              : undefined
          }
          onCancel={() => setTaskSidebar(null)}
          creating={taskSidebar.mode === "create"}
          saving={creating || updating}
          deleting={deprecating}
        />
      )}

      {statusModal && (
        <ActionModal
          open
          onClose={() => setStatusModal(null)}
          title={statusModal.transition.label}
          description={`Change "${statusModal.task.title}" from ${statusModal.task.status} to ${statusModal.transition.status}.`}
          confirmText={statusModal.transition.label}
          modalType={
            statusModal.transition.tone === "forward" ? "approve" : undefined
          }
          loading={updatingStatus}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
}
