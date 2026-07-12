// src/components/taskGraph/TaskGraphNode.jsx
//
// Custom React Flow node for the Task Graph canvas — a condensed version of
// TaskCard.jsx's header row (title, status, priority, at-risk/AI badges),
// reusing the exact same badge components/tones rather than inventing new
// styling. Left handle = incoming ("depends on"), right handle = outgoing
// ("blocks") — dragging right-handle -> left-handle wires up a dependency.

import { Handle, Position } from "@xyflow/react";
import StatusBadge from "../status/statusBadge/StatusBadge";
import StatusBox from "../status/statusBox/StatusBox";
import "./TaskGraphNode.scss";

const PRIORITY_TONE = {
  LOW: "grey",
  MEDIUM: "blue",
  HIGH: "yellow",
  CRITICAL: "red",
};

export default function TaskGraphNode({ data }) {
  const { task } = data;

  return (
    <div className="taskGraphNode">
      <Handle type="target" position={Position.Left} />

      <div className="taskGraphNodeHeader">
        <h5 className="textXS textBold">{task.title}</h5>
        <StatusBadge status={task.status} />
      </div>

      <div className="taskGraphNodeBadges">
        <StatusBox
          status={task.priority || "No Priority"}
          type={PRIORITY_TONE[task.priority] || "grey"}
        />
        {task.is_at_risk && <StatusBox status="AT RISK" type="red" />}
        {task.is_ai_generated && <StatusBox status="AI" type="purple" />}
      </div>

      <p className="textXXS textLight">
        {task.assignee?.full_name || "Unassigned"}
      </p>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
