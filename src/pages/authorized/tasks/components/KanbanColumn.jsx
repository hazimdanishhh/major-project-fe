import TaskKanbanCard from "../../../../components/tasks/taskKanbanCard/TaskKanbanCard";

export default function KanbanColumn({ column, tasks, onTransitionClick }) {
  return (
    <div className="kanbanColumn generalCard">
      <div className="kanbanColumnHeader">
        <h4 className="textS textBold">{column.label}</h4>
        <span className="textXXS textLight">{tasks.length}</span>
      </div>

      <div className="kanbanColumnBody">
        {tasks.length === 0 ? (
          <p className="textXXS textLight">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              onTransitionClick={(transition) =>
                onTransitionClick(task, transition)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
