import { ArrowRightIcon } from "@phosphor-icons/react";
import StatusBadge from "../../../../../components/status/statusBadge/StatusBadge";
import StatusBox from "../../../../../components/status/statusBox/StatusBox";
import SectionHeader from "../../../../../components/sectionHeader/SectionHeader";
import "./RequirementHistoryPanel.scss";

function formatChangedAt(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ChangedByLine({ changedByUser, changedAt }) {
  return (
    <p className="textXXXS textLight historyRowMeta">
      {changedByUser?.full_name || "Unknown"} · {formatChangedAt(changedAt)}
    </p>
  );
}

// Read-only content rendered inside a DataSidebar (isEditing={false}) —
// combines version history and status-change history in one scrollable
// panel rather than a tabbed view, since both lists are typically short and
// a content edit that reverts status often bumps the version in the same beat.
function RequirementHistoryPanel({
  versions,
  history,
  loadingVersions,
  loadingHistory,
}) {
  return (
    <div className="historyPanel">
      <div className="historySection">
        {loadingVersions && <p className="textXS textLight">Loading…</p>}
        {!loadingVersions && versions.length === 0 && (
          <p className="textXS textLight">No versions recorded yet.</p>
        )}
        {versions.map((version) => (
          <div key={version.id} className="historyRow">
            <div className="historyRowHeader">
              <p className="textXS textBold">
                {version.title || "Untitled requirement"}
              </p>
              <StatusBox status={`V${version.version_no}.0`} type="grey" />
            </div>
            {version.description && (
              <p className="textXS textLight historyRowDescription">
                {version.description}
              </p>
            )}
            <ChangedByLine
              changedByUser={version.changed_by_user}
              changedAt={version.changed_at}
            />
          </div>
        ))}
      </div>

      <div className="historySection generalCard">
        <SectionHeader title="Status Changes" />
        {loadingHistory && <p className="textXS textLight">Loading…</p>}
        {!loadingHistory && history.length === 0 && (
          <p className="textXS textLight">No status changes recorded yet.</p>
        )}
        {history.map((entry) => (
          <div key={entry.id} className="historyRow">
            <div className="historyRowHeader">
              <StatusBadge status={entry.old_status} />
              <ArrowRightIcon size="14" />
              <StatusBadge status={entry.new_status} />
            </div>
            <ChangedByLine
              changedByUser={entry.changed_by_user}
              changedAt={entry.changed_at}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RequirementHistoryPanel;
