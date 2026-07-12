// src/pages/authorized/projects/detail/CriticalPathPage.jsx
//
// Project-nested Critical Path tab (/pm/projects/:projectId/critical-path).
// Read-only CPM view: reuses the exact TaskGraphCanvas/TaskGraphNode built
// for Phase 5's Task Graph, layered with critical-path highlighting instead
// of a new graph implementation. Combines two already-existing endpoints:
// useCriticalPath (schedule/criticalPath/projectDuration, no edges) and
// useTaskGraph (tasks/dependencies, no CPM numbers) — merged client-side
// since neither endpoint alone has everything the canvas needs.

import { useMemo } from "react";
import { useParams } from "react-router";
import { ChartLineIcon, ClockIcon, FlagIcon } from "@phosphor-icons/react";
import { useCriticalPath } from "../../../../hooks/useProjects";
import { useTaskGraph } from "../../../../hooks/useTaskGraph";

import CardLayout from "../../../../components/cardLayout/CardLayout";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../../components/crud/noResult/NoResult";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../../components/sectionHeader/SectionHeader";
import IconCard from "../../../../components/iconCard/IconCard";
import TaskGraphCanvas from "../../../../components/taskGraph/TaskGraphCanvas";

export default function CriticalPathPage() {
  const { projectId } = useParams();
  const {
    schedule,
    criticalPath,
    projectDuration,
    isLoading: cpmLoading,
    error: cpmError,
  } = useCriticalPath(projectId);
  const {
    tasks,
    dependencies,
    isLoading: graphLoading,
    error: graphError,
  } = useTaskGraph(projectId);

  const isLoading = cpmLoading || graphLoading;
  const error = cpmError || graphError;

  // Memoized so these keep stable references across re-renders — they're
  // passed straight into TaskGraphCanvas, whose resync effect keys off
  // exactly these props; a fresh Map/Set/array on every render would
  // re-trigger that effect every render and infinite-loop (the same class
  // of bug fixed in TaskGraphCanvas.jsx's own default parameters).
  const scheduleById = useMemo(
    () => new Map(schedule.map((s) => [s.id, s])),
    [schedule],
  );
  const criticalPathIds = useMemo(() => new Set(criticalPath), [criticalPath]);
  // schedule excludes CANCELLED tasks (critical-path controller filters
  // them); task-graph doesn't — filter the graph down to schedule's set so
  // the two data sources agree on which tasks/edges to draw.
  const cpmTasks = useMemo(
    () => tasks.filter((t) => scheduleById.has(t.id)),
    [tasks, scheduleById],
  );
  const cpmDependencies = useMemo(
    () =>
      dependencies.filter(
        (d) =>
          scheduleById.has(d.task_id) && scheduleById.has(d.depends_on_task_id),
      ),
    [dependencies, scheduleById],
  );
  const hasData = cpmTasks.length > 0;

  return (
    <div className="generalCard">
      <PageHeader>
        <SectionHeader title="Critical Path" icon={ChartLineIcon} />

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <IconCard
            name={`${projectDuration}h Project Duration`}
            icon={ClockIcon}
          />
          <IconCard
            name={`${criticalPath.length} Critical Tasks`}
            icon={FlagIcon}
          />
        </div>
      </PageHeader>

      <CardLayout style="cardWrapperScroll generalCard">
        {isLoading ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : error ? (
          <NoResult title="Error loading critical path" />
        ) : !hasData ? (
          <NoResult title="No tasks in this project yet." />
        ) : (
          <TaskGraphCanvas
            tasks={cpmTasks}
            dependencies={cpmDependencies}
            criticalPathIds={criticalPathIds}
            schedule={scheduleById}
            readOnly
          />
        )}
      </CardLayout>
    </div>
  );
}
