// src/pages/authorized/tasks/MemberTasksPage.jsx
//
// Member Kanban board (/member/tasks) — shows only tasks assigned to the
// current member (not all tasks in their visible projects, despite the
// backend's broader RBAC allowing that — narrowed here per product decision).
// No drag-and-drop: each card has status-change buttons instead.

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useMyTasks, useTaskMutations } from "../../../hooks/useTasks";
import PageHeader from "../../../components/crud/pageHeader/PageHeader";
import LoadingIcon from "../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../components/crud/noResult/NoResult";
import ActionModal from "../../../components/modals/actionModal/ActionModal";
import KanbanBoard from "./components/KanbanBoard";

export default function MemberTasksPage() {
  const { user } = useAuth();
  const { tasks, isLoading, error } = useMyTasks(user?.id);
  const { updateTaskStatus, updatingStatus } = useTaskMutations();

  // { task: taskRow, transition: { status, label, tone } }
  const [statusModal, setStatusModal] = useState(null);

  async function handleConfirmStatusChange() {
    await updateTaskStatus({
      taskId: statusModal.task.id,
      status: statusModal.transition.status,
    });
    setStatusModal(null);
  }

  return (
    <div className="pageLayout">
      <PageHeader>
        <div>
          <h1 className="textL textBold">My Tasks</h1>
          <p className="textXXS textLight">Tasks assigned to you.</p>
        </div>
      </PageHeader>

      {isLoading ? (
        <LoadingIcon />
      ) : error ? (
        <NoResult title="Error loading tasks" />
      ) : tasks.length === 0 ? (
        <NoResult title="No tasks assigned to you." />
      ) : (
        <KanbanBoard
          tasks={tasks}
          onTransitionClick={(task, transition) =>
            setStatusModal({ task, transition })
          }
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
