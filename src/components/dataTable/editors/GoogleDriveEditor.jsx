// Placeholder editor for the "drivePicker" column type. A real Google Drive
// picker integration (react-google-drive-picker is already a dependency)
// hasn't been built yet — no current form uses this editor type. This stub
// exists only so Editors.jsx's import resolves; it renders a plain URL
// input as a functional fallback rather than crashing the build.
export default function GoogleDriveEditor({
  value,
  onChange,
  onBlur,
  required,
  readOnly,
}) {
  return (
    <div className="editorContainer">
      <input
        type="text"
        placeholder="Google Drive file URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        readOnly={readOnly}
      />
    </div>
  );
}
