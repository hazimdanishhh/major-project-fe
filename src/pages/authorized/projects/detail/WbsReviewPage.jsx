// src/pages/authorized/projects/detail/WbsReviewPage.jsx
//
// Generate WBS review page (/pm/projects/:projectId/generate-wbs), reached
// via the "Generate WBS" button on ProjectTasksPage.jsx — not a persistent
// tab, an action destination (like "Edit Project" isn't a tab either).
//
// Phase 1 (generate-wbs) and Phase 2 (persist-wbs) already existed fully
// wired on the data layer (useWBSPreview, useProjectMutations' persistWBS)
// since before this page was built — they were simply never called from any
// component. This page is the human-in-the-loop review/edit step between
// them: seeds local editable rows from the AI's preview, lets the PM edit or
// drop rows, then persists the (possibly edited) list.
//
// The wbsPreview query uses staleTime: Infinity (see useProjects.js), so its
// cache is explicitly cleared on both exit paths below — otherwise
// revisiting this page later in the same session would silently show stale
// AI output instead of prompting a fresh generation.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  SparkleIcon,
  ArrowsClockwiseIcon,
  FloppyDiskIcon,
} from "@phosphor-icons/react";
import {
  useWBSPreview,
  useProjectMutations,
  projectKeys,
} from "../../../../hooks/useProjects";
import { useRequirements } from "../../../../hooks/useRequirements";
import { fetchUsers, filterMembers } from "../../../../services/userService";
import { fetchTasks } from "../../../../services/taskService";

import CardLayout from "../../../../components/cardLayout/CardLayout";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../../components/crud/noResult/NoResult";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../../components/sectionHeader/SectionHeader";
import Button from "../../../../components/buttons/button/Button";
import ActionModal from "../../../../components/modals/actionModal/ActionModal";
import WbsTaskRow from "../../../../components/wbs/WbsTaskRow";
import "./WbsReviewPage.scss";

export default function WbsReviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { wbsTasks, isGenerating, generateError, generatePreview } =
    useWBSPreview(projectId);
  const { persistWBS, persistingWBS } = useProjectMutations();
  const { requirements } = useRequirements({ projectId });

  const [rows, setRows] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]);
  const [seenWbsTasks, setSeenWbsTasks] = useState(wbsTasks);

  // Assignee options + existing-task dependency options — fetched once at
  // page level, not per row.
  useEffect(() => {
    fetchUsers()
      .then(({ users }) => setMembers(filterMembers(users)))
      .catch(() => {});
    fetchTasks()
      .then(({ tasks }) =>
        setExistingTasks(
          tasks.filter((t) => t.requirement?.project_id === projectId),
        ),
      )
      .catch(() => {});
  }, [projectId]);

  // Seed/reseed local editable rows whenever a new preview comes back
  // (initial generate or a confirmed regenerate). Adjusted during render
  // (React's recommended pattern for "state derived from a prop/query
  // result changing") rather than in an effect, which would cause an extra
  // render pass.
  if (wbsTasks !== seenWbsTasks) {
    setSeenWbsTasks(wbsTasks);
    if (wbsTasks.length > 0) {
      setRows(wbsTasks);
      setHasGenerated(true);
    }
  }

  const requirementsById = new Map(requirements.map((r) => [r.id, r]));
  const memberOptions = members.map((m) => ({
    label: m.full_name,
    value: m.id,
  }));
  const existingTaskOptions = existingTasks.map((t) => ({
    label: t.title,
    value: t.id,
  }));

  function clearPreviewCache() {
    queryClient.removeQueries({ queryKey: projectKeys.wbsPreview(projectId) });
  }

  function handleRowChange(tempId, updatedRow) {
    setRows((current) =>
      current.map((r) => (r.temp_id === tempId ? updatedRow : r)),
    );
  }

  function handleRemoveRow(tempId) {
    setRows((current) => current.filter((r) => r.temp_id !== tempId));
  }

  async function handleConfirmRegenerate() {
    setRegenerateModalOpen(false);
    await generatePreview();
  }

  function handleCancel() {
    clearPreviewCache();
    navigate(`/pm/projects/${projectId}/tasks`);
  }

  async function handleSave() {
    const tasks = rows.map(
      ({
        temp_id,
        requirement_id,
        title,
        description,
        assignee_id,
        estimated_hours,
        priority,
        depends_on_temp_ids,
        depends_on_existing_task_ids,
        is_ai_generated,
      }) => ({
        temp_id,
        requirement_id,
        title,
        description: description || undefined,
        assignee_id: assignee_id || undefined,
        estimated_hours: estimated_hours ?? undefined,
        priority: priority || undefined,
        depends_on_temp_ids: depends_on_temp_ids?.length
          ? depends_on_temp_ids
          : undefined,
        depends_on_existing_task_ids: depends_on_existing_task_ids?.length
          ? depends_on_existing_task_ids
          : undefined,
        is_ai_generated,
      }),
    );

    await persistWBS({ projectId, tasks });
    clearPreviewCache();
    navigate(`/pm/projects/${projectId}/tasks`);
  }

  const showReviewActions = hasGenerated && !generateError && !isGenerating;

  return (
    <div className="generalCard">
      <PageHeader>
        <SectionHeader title="Generate WBS" icon={SparkleIcon} />

        {showReviewActions && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Button
              style="button buttonType5 textXXS"
              onClick={() => setRegenerateModalOpen(true)}
              name="Regenerate"
              icon2={ArrowsClockwiseIcon}
              weight="fill"
              disabled={persistingWBS}
            />
            <Button
              style="button buttonType4 textXXS"
              onClick={handleCancel}
              name="Cancel"
              disabled={persistingWBS}
            />
            <Button
              style="button buttonType5 approval textXXS"
              onClick={handleSave}
              name="Save All Tasks"
              icon2={FloppyDiskIcon}
              weight="fill"
              disabled={persistingWBS || rows.length === 0}
            />
          </div>
        )}
      </PageHeader>

      <CardLayout style="cardWrapperScroll generalCard">
        {isGenerating ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : generateError ? (
          <div className="wbsReviewIntro">
            <NoResult
              title={generateError.message || "AI generation failed."}
            />
            <Button
              style="button buttonType5 approval textXXS"
              onClick={() => generatePreview()}
              name="Try Again"
              icon2={SparkleIcon}
              weight="fill"
            />
          </div>
        ) : !hasGenerated ? (
          <div className="wbsReviewIntro">
            <p className="textS textBold">
              Generate an AI-assisted task breakdown
            </p>
            <p className="textXS textLight">
              Gathers every APPROVED requirement in this project with a
              finalized specification and asks the AI to propose a task list.
              Nothing is saved until you review and confirm below.
            </p>
            <Button
              style="button buttonType5 approval textXXS"
              onClick={() => generatePreview()}
              name="Generate WBS"
              icon2={SparkleIcon}
              weight="fill"
            />
          </div>
        ) : rows.length === 0 ? (
          <NoResult title="No tasks left to save — every suggested task was removed." />
        ) : (
          <CardLayout style="cardLayout1 cardGapSmall cardPaddingSmall">
            {rows.map((row) => (
              <WbsTaskRow
                key={row.temp_id}
                row={row}
                onChange={(updated) => handleRowChange(row.temp_id, updated)}
                onRemove={() => handleRemoveRow(row.temp_id)}
                requirementTitle={
                  requirementsById.get(row.requirement_id)?.title ||
                  "Unknown requirement"
                }
                memberOptions={memberOptions}
                siblingOptions={rows
                  .filter((r) => r.temp_id !== row.temp_id)
                  .map((r) => ({ label: r.title, value: r.temp_id }))}
                existingTaskOptions={existingTaskOptions}
              />
            ))}
          </CardLayout>
        )}
      </CardLayout>

      {regenerateModalOpen && (
        <ActionModal
          open
          onClose={() => setRegenerateModalOpen(false)}
          title="Regenerate WBS"
          description="This discards your current edits and asks the AI for a fresh task breakdown."
          confirmText="Regenerate"
          loading={isGenerating}
          onConfirm={handleConfirmRegenerate}
        />
      )}
    </div>
  );
}
