// src/components/taskGraph/computeLayout.js
//
// Pure layout function for the Task Graph canvas: assigns each task an x/y
// position based on its depth in the dependency DAG — level 0 for tasks
// with no parents, else 1 + max(parent levels). Conceptually the same
// longest-path-from-root idea major-project-be's algorithms.js already uses
// in topoSort/calculateCriticalPath, just without hours weighting (that's
// what the Critical Path view, Phase 6, is for). Nodes stay draggable
// afterward — this only supplies a sensible initial arrangement, not a
// persisted one.

const LEVEL_WIDTH = 260;
const ROW_HEIGHT = 160;

// tasks: {id: string}[]
// dependencies: {task_id: string, depends_on_task_id: string}[]
// returns Map<taskId, {x: number, y: number}>
export function computeLayout(tasks, dependencies) {
  const parents = {};
  tasks.forEach((t) => {
    parents[t.id] = [];
  });
  dependencies.forEach(({ task_id, depends_on_task_id }) => {
    if (parents[task_id]) parents[task_id].push(depends_on_task_id);
  });

  const level = {};

  function levelOf(id, seen) {
    if (level[id] !== undefined) return level[id];
    if (seen.has(id)) return 0; // stray cycle guard — should never trigger, backend rejects cycles
    seen.add(id);
    const ps = parents[id] || [];
    const l = ps.length ? 1 + Math.max(...ps.map((p) => levelOf(p, seen))) : 0;
    level[id] = l;
    return l;
  }

  tasks.forEach((t) => levelOf(t.id, new Set()));

  const countPerLevel = {};
  const positions = new Map();

  tasks.forEach((t) => {
    const l = level[t.id];
    const row = countPerLevel[l] ?? 0;
    countPerLevel[l] = row + 1;
    positions.set(t.id, { x: l * LEVEL_WIDTH, y: row * ROW_HEIGHT });
  });

  return positions;
}
