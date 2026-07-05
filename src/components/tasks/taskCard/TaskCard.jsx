import {
  ClipboardTextIcon,
  ClockIcon,
  FolderSimpleIcon,
  PencilSimpleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import Button from "../../buttons/button/Button";
import IconCard from "../../iconCard/IconCard";
import StatusBadge from "../../status/statusBadge/StatusBadge";
import StatusBox from "../../status/statusBox/StatusBox";
import { useAccessControl } from "../../../context/AccessControlContext";
import { TASK_STATUS_TRANSITIONS } from "../../../hooks/useTasks";
import "./TaskCard.scss";

const PRIORITY_TONE = {
  LOW: "grey",
  MEDIUM: "blue",
  HIGH: "yellow",
  CRITICAL: "red",
};

// Shared by the PM All Tasks page and the project-nested Tasks page.
// `hideProject` drops the project label when the project is already fixed
// by the page's URL (project-nested page). `projectName` is passed in by
// the parent rather than looked up here — the task list response only
// embeds { id, title, project_id } on `requirement`, no project name, so
// resolving it requires a project list the parent already has/fetches once.
export default function TaskCard({
  task,
  hideProject = false,
  projectName,
  onEdit,
  onTransitionClick,
}) {
  const { canAccess } = useAccessControl();
  const transitions = TASK_STATUS_TRANSITIONS[task.status] ?? [];
  const canManage = canAccess({ roles: ["pm"] });

  return (
    <div className="generalCard">
      <div className="requirementCard">
        <div className="requirementCardLeft">
          <div className="requirementCardHeader">
            <h4 className="textS textBold">{task.title}</h4>
            <StatusBadge status={task.status} />
            <StatusBox
              status={task.priority || "No Priority"}
              type={PRIORITY_TONE[task.priority] || "grey"}
            />
            {task.is_at_risk && <StatusBox status="AT RISK" type="red" />}
            {task.is_ai_generated && <StatusBox status="AI" type="purple" />}
          </div>

          {task.description && (
            <p className="textXS textLight">{task.description}</p>
          )}

          <div className="taskCardMeta">
            <IconCard
              icon={ClipboardTextIcon}
              name={task.requirement?.title || "—"}
              style="textXXS textLight"
            />
            {!hideProject && (
              <IconCard
                icon={FolderSimpleIcon}
                name={projectName || "Unknown Project"}
                style="textXXS textLight"
              />
            )}
            <IconCard
              icon={UserCircleIcon}
              name={task.assignee?.full_name || "Unassigned"}
              style="textXXS textLight"
            />
            <IconCard
              icon={ClockIcon}
              name={`${task.estimated_hours ?? 0}h`}
              style="textXXS textLight"
            />
          </div>
        </div>

        <div className="requirementCardRight">
          {canManage &&
            transitions.map((t) => (
              <Button
                key={t.status}
                style={`button buttonType5 ${t.tone === "forward" ? "approval" : "rejection"} textXXS`}
                onClick={() => onTransitionClick?.(t)}
                name={t.label}
                weight="fill"
              />
            ))}
          {canManage && (
            <Button
              style="button buttonType5 textXXS"
              onClick={onEdit}
              name="Edit"
              icon={PencilSimpleIcon}
              weight="fill"
            />
          )}
        </div>
      </div>
    </div>
  );
}
