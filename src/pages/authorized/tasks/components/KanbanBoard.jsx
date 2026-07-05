import { KANBAN_COLUMNS } from "../../../../hooks/useTasks";
import KanbanColumn from "./KanbanColumn";
import "./KanbanBoard.scss";

export default function KanbanBoard({ tasks, onTransitionClick }) {
  return (
    <div className="kanbanBoard">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.status}
          column={column}
          tasks={tasks.filter((t) => t.status === column.status)}
          onTransitionClick={onTransitionClick}
        />
      ))}
    </div>
  );
}
