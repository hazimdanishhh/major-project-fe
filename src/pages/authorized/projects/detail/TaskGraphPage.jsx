// src/pages/authorized/projects/detail/TaskGraphPage.jsx
//
// Project-nested Task Graph tab (/pm/projects/:projectId/task-graph).
// Visualizes task_dependencies as a DAG via TaskGraphCanvas (@xyflow/react):
// dragging a connection between two nodes' handles adds a dependency edge,
// clicking an edge opens a remove-confirmation. The "Add Dependency" button
// covers the same add action via two selects, for when two nodes aren't
// conveniently positioned to drag between. Cycle/duplicate rejection is
// entirely backend-driven (DFS cycle check in algorithms.js) — surfaced
// here as a toast via useDependencyMutations, never pre-validated
// client-side.

import { useState } from "react";
import { useParams } from "react-router";
import { FlowArrowIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import { useAccessControl } from "../../../../context/AccessControlContext";
import {
  useTaskGraph,
  useDependencyMutations,
} from "../../../../hooks/useTaskGraph";

import CardLayout from "../../../../components/cardLayout/CardLayout";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../../components/crud/noResult/NoResult";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../../components/sectionHeader/SectionHeader";
import Button from "../../../../components/buttons/button/Button";
import ActionModal from "../../../../components/modals/actionModal/ActionModal";
import TaskGraphCanvas from "../../../../components/taskGraph/TaskGraphCanvas";

export default function TaskGraphPage() {
  const { projectId } = useParams();
  const { canAccess } = useAccessControl();
  const { tasks, dependencies, isLoading, error } = useTaskGraph(projectId);
  const { addDependency, adding, removeDependency, removing } =
    useDependencyMutations(projectId);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModal, setRemoveModal] = useState(null); // { edge }

  const canManage = canAccess({ roles: ["pm"] });
  const hasData = tasks.length > 0;
  const taskOptions = tasks.map((t) => ({ label: t.title, value: t.id }));

  function taskTitle(id) {
    return tasks.find((t) => t.id === id)?.title || "this task";
  }

  async function handleConnect(params) {
    await addDependency({
      task_id: params.target,
      depends_on_task_id: params.source,
    });
  }

  async function handleAddDependencyModal(formValues) {
    await addDependency({
      task_id: formValues.task_id,
      depends_on_task_id: formValues.depends_on_task_id,
    });
    setAddModalOpen(false);
  }

  async function handleConfirmRemove() {
    const { task_id, depends_on_task_id } = removeModal.edge.data;
    await removeDependency({ task_id, depends_on_task_id });
    setRemoveModal(null);
  }

  return (
    <div className="generalCard">
      <PageHeader>
        <SectionHeader title="Task Graph" icon={FlowArrowIcon} />

        {canManage && (
          <Button
            style="button buttonType5 approval textXXS"
            onClick={() => setAddModalOpen(true)}
            name="Add Dependency"
            icon2={LinkSimpleIcon}
            weight="fill"
            disabled={tasks.length < 2}
          />
        )}
      </PageHeader>

      <CardLayout style="cardWrapperScroll generalCard">
        {isLoading ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : error ? (
          <NoResult title="Error loading task graph" />
        ) : !hasData ? (
          <NoResult title="No tasks in this project yet." />
        ) : (
          <TaskGraphCanvas
            tasks={tasks}
            dependencies={dependencies}
            onConnect={handleConnect}
            onEdgeClick={(edge) => setRemoveModal({ edge })}
          />
        )}
      </CardLayout>

      {addModalOpen && (
        <ActionModal
          open
          onClose={() => setAddModalOpen(false)}
          title="Add Dependency"
          description="Choose a task and the task it depends on."
          confirmText="Add Dependency"
          modalType="save"
          loading={adding}
          fields={[
            {
              name: "task_id",
              label: "Task",
              type: "select",
              required: true,
              options: taskOptions,
            },
            {
              name: "depends_on_task_id",
              label: "Depends On",
              type: "select",
              required: true,
              options: taskOptions,
            },
          ]}
          onConfirm={handleAddDependencyModal}
        />
      )}

      {removeModal && (
        <ActionModal
          open
          onClose={() => setRemoveModal(null)}
          title="Remove Dependency"
          description={`"${taskTitle(removeModal.edge.data.task_id)}" will no longer depend on "${taskTitle(removeModal.edge.data.depends_on_task_id)}".`}
          confirmText="Remove"
          loading={removing}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  );
}
