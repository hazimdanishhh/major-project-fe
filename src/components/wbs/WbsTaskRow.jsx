// src/components/wbs/WbsTaskRow.jsx
//
// One AI-suggested task in the Generate WBS review table (Phase 7) — fully
// editable in place before persist-wbs is called. Visual language borrowed
// from TaskCard.jsx/TaskGraphNode.jsx (StatusBox/PRIORITY_TONE conventions)
// rather than invented fresh; the dependency multi-selects reuse the same
// react-select "unstyled" convention SelectEditor.jsx already established.
//
// requirement_id is intentionally read-only here — the LLM already scoped
// each task to the requirement it was generated from, and reassigning
// cross-requirement isn't worth the added complexity for this phase.

import Select from "react-select";
import { TrashIcon } from "@phosphor-icons/react";
import Button from "../buttons/button/Button";
import StatusBox from "../status/statusBox/StatusBox";
import { PRIORITY_TONE } from "../../constants/taskTones";
import "./WbsTaskRow.scss";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

export default function WbsTaskRow({
  row,
  onChange,
  onRemove,
  requirementTitle,
  memberOptions,
  siblingOptions,
  existingTaskOptions,
}) {
  function set(field, value) {
    onChange({ ...row, [field]: value });
  }

  return (
    <div className="generalCard wbsTaskRow">
      <div className="wbsTaskRowHeader">
        <input
          className="wbsTaskRowTitle textS textBold"
          value={row.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Task title"
        />
        <StatusBox status="AI" type="purple" />
        <Button
          style="button buttonType5 rejection textXXS"
          onClick={onRemove}
          icon={TrashIcon}
          title="Remove this task from the WBS"
          weight="fill"
        />
      </div>

      <p className="textXXS textLight">Requirement: {requirementTitle}</p>

      <textarea
        className="wbsTaskRowDescription textXXS"
        value={row.description || ""}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Description (optional)"
      />

      <div className="wbsTaskRowFields">
        <div className="wbsTaskRowField">
          <label className="textXXS textLight">Assignee</label>
          <Select
            unstyled
            className="selectContainer"
            classNamePrefix="reactSelect"
            isClearable
            placeholder="Unassigned"
            options={memberOptions}
            value={
              memberOptions.find((o) => o.value === row.assignee_id) || null
            }
            onChange={(opt) => set("assignee_id", opt ? opt.value : null)}
          />
        </div>

        <div className="wbsTaskRowField">
          <label className="textXXS textLight">Estimated Hours</label>
          <input
            type="number"
            min={0}
            value={row.estimated_hours ?? 0}
            onChange={(e) => set("estimated_hours", Number(e.target.value))}
          />
        </div>

        <div className="wbsTaskRowField">
          <label className="textXXS textLight">Priority</label>
          <div className="wbsTaskRowPriority">
            <Select
              unstyled
              className="selectContainer"
              classNamePrefix="reactSelect"
              options={PRIORITY_OPTIONS}
              value={
                PRIORITY_OPTIONS.find((o) => o.value === row.priority) ||
                PRIORITY_OPTIONS[1]
              }
              onChange={(opt) => set("priority", opt.value)}
            />
            <StatusBox
              status={row.priority || "MEDIUM"}
              type={PRIORITY_TONE[row.priority] || "blue"}
            />
          </div>
        </div>
      </div>

      <div className="wbsTaskRowFields">
        <div className="wbsTaskRowField">
          <label className="textXXS textLight">Depends On (new tasks)</label>
          <Select
            isMulti
            unstyled
            className="selectContainer"
            classNamePrefix="reactSelect"
            placeholder="None"
            options={siblingOptions}
            value={siblingOptions.filter((o) =>
              (row.depends_on_temp_ids || []).includes(o.value),
            )}
            onChange={(opts) =>
              set(
                "depends_on_temp_ids",
                (opts || []).map((o) => o.value),
              )
            }
          />
        </div>

        <div className="wbsTaskRowField">
          <label className="textXXS textLight">
            Depends On (existing tasks)
          </label>
          <Select
            isMulti
            unstyled
            className="selectContainer"
            classNamePrefix="reactSelect"
            placeholder="None"
            options={existingTaskOptions}
            value={existingTaskOptions.filter((o) =>
              (row.depends_on_existing_task_ids || []).includes(o.value),
            )}
            onChange={(opts) =>
              set(
                "depends_on_existing_task_ids",
                (opts || []).map((o) => o.value),
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
