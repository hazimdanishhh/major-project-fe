import "./ProgressBar.scss";

// completion: {total, completed, percentage} — the exact shape returned by
// the backend's calculateProjectCompletion/calculateRequirementCompletion
// (major-project-be/src/algorithms.js). Falls back to 0/0/0% if not yet
// loaded, rather than crashing on a missing field.
function ProgressBar({ completion, label }) {
  const { total = 0, completed = 0, percentage = 0 } = completion || {};

  return (
    <div className="progressBarContainer">
      {label && (
        <div className="progressBarLabel">
          <span className="textXXS textLight">{label}</span>
          <span className="textXXS textBold">
            {completed}/{total} ({percentage}%)
          </span>
        </div>
      )}
      <div className="progressBarTrack">
        <div className="progressBarFill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
