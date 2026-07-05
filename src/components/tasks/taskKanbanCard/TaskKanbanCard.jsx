import Button from "../../buttons/button/Button";
import StatusBox from "../../status/statusBox/StatusBox";
import { TASK_STATUS_TRANSITIONS } from "../../../hooks/useTasks";
import "./TaskKanbanCard.scss";

const PRIORITY_TONE = {
  LOW: "grey",
  MEDIUM: "blue",
  HIGH: "yellow",
  CRITICAL: "red",
};

// Read-only otherwise — no edit/delete affordances here, members have no
// metadata-edit UI in this phase. Status control is buttons, not drag-and-drop.
export default function TaskKanbanCard({ task, onTransitionClick }) {
  const transitions = TASK_STATUS_TRANSITIONS[task.status] ?? [];

  return (
    <div className="generalCard taskKanbanCard">
      <div className="taskKanbanCardHeader">
        <p className="textXS textBold">{task.title}</p>
        <StatusBox
          status={task.priority || "No Priority"}
          type={PRIORITY_TONE[task.priority] || "grey"}
        />
      </div>

      {task.is_at_risk && <StatusBox status="AT RISK" type="red" />}

      <p className="textXXS textLight">
        {task.requirement?.title} · {task.estimated_hours ?? 0}h
      </p>

      {transitions.length > 0 && (
        <div className="taskKanbanCardActions">
          {transitions.map((t) => (
            <Button
              key={t.status}
              style={`button buttonType5 ${t.tone === "forward" ? "approval" : "rejection"} textXXS`}
              onClick={() => onTransitionClick(t)}
              name={t.label}
              weight="fill"
            />
          ))}
        </div>
      )}
    </div>
  );
}
