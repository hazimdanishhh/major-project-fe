import { useState } from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import Button from "../../../../components/buttons/button/Button";
import StatusBox from "../../../../components/status/statusBox/StatusBox";
import "./TemporaryPasswordPanel.scss";

// Shown once, immediately after a team member is created — the generated
// password is never retrievable again after this render, so the copy
// action and the warning both matter.
function TemporaryPasswordPanel({ user, temporaryPassword, onDone }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="temporaryPasswordPanel">
      <p className="textXS textLight">
        Account created for <strong>{user.full_name}</strong> ({user.email}).
        Share this password with them now — it will not be shown again.
      </p>

      <div className="temporaryPasswordRow">
        <StatusBox status={temporaryPassword} type="grey" />
        <Button
          style="button buttonType5 textXXS"
          onClick={handleCopy}
          name={copied ? "Copied" : "Copy"}
          icon={copied ? CheckIcon : CopyIcon}
          weight="fill"
        />
      </div>

      <Button
        style="button buttonType5 approval textXXS"
        onClick={onDone}
        name="Done"
        weight="fill"
      />
    </div>
  );
}

export default TemporaryPasswordPanel;
