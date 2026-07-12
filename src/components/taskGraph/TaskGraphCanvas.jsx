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

function buildEdges(dependencies) {
  return dependencies.map((dep) => ({
    id: `${dep.task_id}-${dep.depends_on_task_id}`,
    source: dep.depends_on_task_id,
    target: dep.task_id,
    data: {
      task_id: dep.task_id,
      depends_on_task_id: dep.depends_on_task_id,
    },
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
}

export default function TaskGraphCanvas({
  tasks,
  dependencies,
  onConnect,
  onEdgeClick,
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
          data: { task },
        };
      });
    });
    setEdges(buildEdges(dependencies));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, dependencies]);

  return (
    <div className="taskGraphCanvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={(_event, edge) => onEdgeClick(edge)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
