// src/components/taskGraph/TaskGraphCanvas.jsx
//
// Renders a project's task dependency graph via @xyflow/react: nodes = tasks
// (positioned by computeLayout's dependency-depth levels, then freely
// draggable), edges = task_dependencies rows, arrow pointing from the
// prerequisite to the dependent task. Editing is delegated to the parent:
// dragging a connection between two node handles calls onConnect, clicking
// an existing edge calls onEdgeClick — neither mutates local state directly,
// since the source of truth is the backend (cycle/duplicate rejection has
// to round-trip there) and TanStack Query's invalidation feeds fresh
// tasks/dependencies back in as props, resynced below.
//
// Also doubles as the Critical Path view's canvas (Phase 6): passing
// criticalPathIds/schedule layers CPM highlighting on top without changing
// anything for the plain Task Graph tab, which doesn't pass them.

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { computeLayout } from "./computeLayout";
import TaskGraphNode from "./TaskGraphNode";
import "./TaskGraphCanvas.scss";

const nodeTypes = { taskNode: TaskGraphNode };

// Stable empty references for the Critical Path props Task Graph doesn't
// pass — a `= new Set()`/`= new Map()` default parameter creates a NEW
// object on every render, which would change the resync effect's
// dependency array every render and infinite-loop (same reasoning as
// ActionModal.jsx's EMPTY_FIELDS).
const EMPTY_CRITICAL_PATH_IDS = new Set();
const EMPTY_SCHEDULE = new Map();

function buildEdges(dependencies, criticalPathIds) {
  return dependencies.map((dep) => {
    const isCritical =
      criticalPathIds.has(dep.task_id) &&
      criticalPathIds.has(dep.depends_on_task_id);
    return {
      id: `${dep.task_id}-${dep.depends_on_task_id}`,
      source: dep.depends_on_task_id,
      target: dep.task_id,
      data: {
        task_id: dep.task_id,
        depends_on_task_id: dep.depends_on_task_id,
      },
      animated: isCritical,
      style: isCritical ? { stroke: "#d76363", strokeWidth: 2.5 } : undefined,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isCritical ? "#d76363" : undefined,
      },
    };
  });
}

export default function TaskGraphCanvas({
  tasks,
  dependencies,
  onConnect,
  onEdgeClick,
  criticalPathIds = EMPTY_CRITICAL_PATH_IDS,
  schedule = EMPTY_SCHEDULE,
  readOnly = false,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Resyncs whenever the underlying task/dependency data changes (e.g. after
  // a dependency add/remove refetch) — existing nodes keep whatever position
  // the user dragged them to; only genuinely new nodes get a computed one.
  useEffect(() => {
    const positions = computeLayout(tasks, dependencies);
    setNodes((current) => {
      const existingById = new Map(current.map((n) => [n.id, n]));
      return tasks.map((task) => {
        const existing = existingById.get(task.id);
        return {
          id: task.id,
          type: "taskNode",
          position: existing?.position ?? positions.get(task.id) ?? { x: 0, y: 0 },
          data: {
            task,
            isCritical: criticalPathIds.has(task.id),
            cpm: schedule.get(task.id),
          },
        };
      });
    });
    setEdges(buildEdges(dependencies, criticalPathIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, dependencies, criticalPathIds, schedule]);

  return (
    <div className="taskGraphCanvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onEdgeClick={readOnly ? undefined : (_event, edge) => onEdgeClick(edge)}
        nodesConnectable={!readOnly}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
