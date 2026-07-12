// src/pages/authorized/projects/detail/ProjectTasksPage.jsx
//
// Project-nested Tasks tab (/pm/projects/:projectId/tasks). Flat list, not
// grouped by requirement — reuses the exact same list/pagination machinery
// as TasksPage.jsx (the PM All Tasks page), scoped to this project via
// taskListQueryFn's extraParams.projectId, with a requirement filter instead
// of the All Tasks page's project filter (redundant here since the project
// is already fixed by the URL).

import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ListChecksIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { useAccessControl } from "../../../../context/AccessControlContext";
import { useMessage } from "../../../../context/MessageContext";

import usePaginatedQuery from "../../../../hooks/usePaginatedQuery";
import { taskListQueryFn, useTaskMutations } from "../../../../hooks/useTasks";

import Button from "../../../../components/buttons/button/Button";
import CardLayout from "../../../../components/cardLayout/CardLayout";
import ActiveFiltersBar from "../../../../components/crud/activeFiltersBar/ActiveFiltersBar";
import DataSidebar from "../../../../components/dataSidebar/DataSidebar";
import NoResult from "../../../../components/crud/noResult/NoResult";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import PageResult from "../../../../components/crud/pageResult/PageResult";
import SearchFilterBar from "../../../../components/crud/searchFilterBar/SearchFilterBar";
import SortBar from "../../../../components/crud/sortBar/SortBar";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import ActionModal from "../../../../components/modals/actionModal/ActionModal";
import SectionHeader from "../../../../components/sectionHeader/SectionHeader";
import TaskCard from "../../../../components/tasks/taskCard/TaskCard";
import { getTaskColumns } from "../../tasks/config/taskFormConfig";
import { getFilterConfig } from "../../tasks/config/taskFilterConfig";
import { getSortConfig } from "../../tasks/config/taskSortConfig";

export default function ProjectTasksPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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

  const [taskSidebar, setTaskSidebar] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

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
    extraParams: { projectId },
    enabled: !!projectId,
  });

  const filterConfig = getFilterConfig({
    scope: "project",
    projectId,
    showMessage,
  });
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
    <div className="generalCard">
      <PageHeader>
        <SectionHeader title="Tasks" icon={ListChecksIcon} />

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
              style="button buttonType5 textXXS"
              onClick={() => navigate(`/pm/projects/${projectId}/generate-wbs`)}
              name="Generate WBS"
              icon2={SparkleIcon}
              weight="fill"
            />
          )}

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

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        filterConfig={filterConfig}
        placeholder="Search tasks..."
      />

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

      <PageResult
        data={tasks}
        totalCount={totalCount}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        error={error}
      />

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
                hideProject
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
            projectId,
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
