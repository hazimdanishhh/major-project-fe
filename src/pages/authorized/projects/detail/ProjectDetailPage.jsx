import {
  PencilSimpleIcon,
  PlayCircleIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import { useParams } from "react-router";
import Button from "../../../../components/buttons/button/Button";
import StatusBadge from "../../../../components/status/statusBadge/StatusBadge";
import StatusBox from "../../../../components/status/statusBox/StatusBox";
import { useAccessControl } from "../../../../context/AccessControlContext";
import { useRequirements } from "../../../../hooks/useRequirements";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const { requirements, isLoading, error } = useRequirements({ projectId });
  const { canAccess, isPm, isClient } = useAccessControl();

  console.log(requirements);

  return (
    <div className="generalCard">
      {canAccess({ roles: ["pm"] }) && (
        <Button
          style="button buttonType5 approval textXXS"
          onClick={() => console.log("New requirement clicked - coming soon")}
          name="New Requirement"
          icon2={PlusCircleIcon}
          weight="fill"
        />
      )}

      {requirements.map((requirement) => (
        <div key={requirement.id} className="generalCard">
          <h4 className="textS textBold">{requirement.title}</h4>
          <p className="textXS textLight">{requirement.description}</p>

          <StatusBox status={`V${requirement.current_version}.0`} type="grey" />
          <StatusBadge status={requirement.status} />

          {/* STATUS CHANGE BUTTONS */}

          {canAccess({ roles: ["pm"] }) && (
            <div>
              <Button
                style="button buttonType5 approval textXXS"
                onClick={() => console.log("Change status to Submit")}
                name="Submit"
                icon={PlayCircleIcon}
                weight="fill"
              />
              <Button
                style="button buttonType5 textXXS"
                onClick={() => console.log("Open DataSidebar")}
                name="Edit"
                icon={PencilSimpleIcon}
                weight="fill"
              />
            </div>
          )}

          {canAccess({ roles: ["pm"] }) && (
            <div>
              <Button
                style="button buttonType5 approval textXXS"
                onClick={() => console.log("Change status to Submit")}
                name="Add Specification"
                icon={PlusCircleIcon}
                weight="fill"
              />
              <Button
                style="button buttonType5 textXXS"
                onClick={() => console.log("Open DataSidebar")}
                name="Edit"
                icon={PencilSimpleIcon}
                weight="fill"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProjectDetailPage;
