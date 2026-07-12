// src/constants/taskTones.js
//
// Shared StatusBox tone map for task priority, used anywhere a task's
// priority is rendered (TaskCard, TaskGraphNode, the WBS review table) so
// the mapping can't drift into a third slightly-different copy.

export const PRIORITY_TONE = {
  LOW: "grey",
  MEDIUM: "blue",
  HIGH: "yellow",
  CRITICAL: "red",
};
