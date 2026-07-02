import { useState } from "react";
import {
  ClipboardTextIcon,
  FileTextIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { useParams } from "react-router";
import Button from "../../../../components/buttons/button/Button";
import StatusBadge from "../../../../components/status/statusBadge/StatusBadge";
import StatusBox from "../../../../components/status/statusBox/StatusBox";
import DataSidebar from "../../../../components/dataSidebar/DataSidebar";
import ActionModal from "../../../../components/modals/actionModal/ActionModal";
import { useAccessControl } from "../../../../context/AccessControlContext";
import { useMessage } from "../../../../context/MessageContext";
import {
  useRequirements,
  useRequirementMutations,
  REQUIREMENT_STATUS_TRANSITIONS,
  SPEC_ALLOWED_STATUSES,
} from "../../../../hooks/useRequirements";
import {
  getRequirementColumns,
  getSpecColumns,
} from "./config/requirementFormConfig";
import "./ProjectDetailPage.scss";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import SectionHeader from "../../../../components/sectionHeader/SectionHeader";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const { requirements, isLoading, error } = useRequirements({ projectId });
  console.log(requirements);
  const { canAccess } = useAccessControl();
  const { showMessage } = useMessage();
  const {
    createRequirement,
    creating,
    updateRequirementContent,
    updatingContent,
    advanceRequirementStatus,
    advancingStatus,
    archiveRequirement,
    archiving,
    createSpec,
    creatingSpec,
    updateSpec,
    updatingSpec,
  } = useRequirementMutations();

  // { mode: "create" | "edit", requirement: {} | requirementRow }
  const [requirementSidebar, setRequirementSidebar] = useState(null);
  // { mode: "create" | "edit", requirement: requirementRow, spec: {} | specRow }
  const [specSidebar, setSpecSidebar] = useState(null);
  // { requirement: requirementRow, transition: { status, label, tone } }
  const [statusModal, setStatusModal] = useState(null);

  async function handleSaveRequirement(formData) {
    const payload = {
      title: formData.title,
      description: formData.description,
    };
    if (requirementSidebar.mode === "create") {
      await createRequirement({ project_id: projectId, ...payload });
    } else {
      await updateRequirementContent({
        requirementId: requirementSidebar.requirement.id,
        updates: payload,
      });
    }
    setRequirementSidebar(null);
  }

  async function handleArchiveRequirement() {
    await archiveRequirement(requirementSidebar.requirement.id);
    setRequirementSidebar(null);
  }

  async function handleConfirmStatusChange() {
    await advanceRequirementStatus({
      requirementId: statusModal.requirement.id,
      newStatus: statusModal.transition.status,
    });
    setStatusModal(null);
  }

  async function handleSaveSpec(formData) {
    const payload = {
      title: formData.title || undefined,
      description: formData.description,
      acceptance_criteria: formData.acceptance_criteria || undefined,
      complexity_score:
        formData.complexity_score === "" || formData.complexity_score == null
          ? undefined
          : Number(formData.complexity_score),
      status: formData.status || undefined,
    };
    if (specSidebar.mode === "create") {
      await createSpec({
        requirementId: specSidebar.requirement.id,
        specData: payload,
      });
    } else {
      await updateSpec({
        requirementId: specSidebar.requirement.id,
        specId: specSidebar.spec.id,
        updates: payload,
      });
    }
    setSpecSidebar(null);
  }

  return (
    <div className="generalCard">
      <PageHeader>
        <SectionHeader title="Requirements" icon={ClipboardTextIcon} />

        {canAccess({ roles: ["pm", "client"] }) && (
          <Button
            style="button buttonType5 approval textXXS"
            onClick={() =>
              setRequirementSidebar({ mode: "create", requirement: {} })
            }
            name="New Requirement"
            icon2={PlusCircleIcon}
            weight="fill"
          />
        )}
      </PageHeader>

      {requirements.map((requirement, index) => {
        const specsAllowed = SPEC_ALLOWED_STATUSES.includes(requirement.status);
        const transitions =
          REQUIREMENT_STATUS_TRANSITIONS[requirement.status] ?? [];

        return (
          <div key={requirement.id} className="generalCard">
            <div className="requirementCard">
              <div className="requirementCardLeft">
                <div className="requirementCardHeader">
                  <h4 className="textS textBold">
                    {index + 1} - {requirement.title}
                  </h4>
                  <StatusBox
                    status={`V${requirement.current_version}.0`}
                    type="grey"
                  />
                  <StatusBadge status={requirement.status} />
                </div>
                <p className="textXS textLight">{requirement.description}</p>
              </div>

              {/* STATUS CHANGE BUTTONS */}
              {canAccess({ roles: ["pm", "client"] }) && (
                <div className="requirementCardRight">
                  {transitions.map((t) => (
                    <Button
                      key={t.status}
                      style={`button buttonType5 ${t.tone === "forward" ? "approval" : "rejection"} textXXS`}
                      onClick={() =>
                        setStatusModal({ requirement, transition: t })
                      }
                      name={t.label}
                      weight="fill"
                    />
                  ))}
                  <Button
                    style="button buttonType5 textXXS"
                    onClick={() =>
                      setRequirementSidebar({ mode: "edit", requirement })
                    }
                    name="Edit"
                    icon={PencilSimpleIcon}
                    weight="fill"
                  />
                </div>
              )}
            </div>

            {(requirement.requirement_specifications || []).length > 0 && (
              <div className="generalCard sectionDark">
                <PageHeader>
                  <SectionHeader title="Specifications" icon={WrenchIcon} />

                  {canAccess({ roles: ["pm"] }) && (
                    <Button
                      style="button buttonType5 approval textXXS"
                      onClick={() =>
                        setSpecSidebar({
                          mode: "create",
                          requirement,
                          spec: {},
                        })
                      }
                      name="Add Specification"
                      icon={PlusCircleIcon}
                      weight="fill"
                      disabled={!specsAllowed}
                      title={
                        !specsAllowed
                          ? "Specs can only be added while Under Analysis or Specification Drafted"
                          : undefined
                      }
                    />
                  )}
                </PageHeader>

                {requirement.requirement_specifications.map((spec, index) => (
                  <div
                    key={spec.id}
                    className="generalCard requirementCard specificationCard"
                  >
                    <div className="requirementCardLeft">
                      <div className="requirementCardHeader">
                        <p className="textXS textBold">
                          {index + 1} - {spec.title || "Untitled specification"}
                        </p>
                        <StatusBadge status={spec.status} />
                        {spec.complexity_score !== null &&
                          spec.complexity_score !== undefined && (
                            <StatusBox
                              status={`Complexity: ${spec.complexity_score}`}
                              type="grey"
                            />
                          )}
                      </div>

                      <p className="textXS textLight">{spec.description}</p>
                    </div>

                    <div className="requirementCardRight">
                      {canAccess({ roles: ["pm"] }) && (
                        <Button
                          style="button buttonType5 textXXS"
                          onClick={() =>
                            setSpecSidebar({ mode: "edit", requirement, spec })
                          }
                          name="Edit"
                          icon={PencilSimpleIcon}
                          weight="fill"
                          disabled={!specsAllowed}
                          title={
                            !specsAllowed
                              ? "Specs can only be edited while Under Analysis or Specification Drafted"
                              : undefined
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {requirementSidebar && (
        <DataSidebar
          title={
            requirementSidebar.mode === "create"
              ? "New Requirement"
              : "Edit Requirement"
          }
          icon={
            requirementSidebar.mode === "create"
              ? PlusCircleIcon
              : PencilSimpleIcon
          }
          open
          onClose={() => setRequirementSidebar(null)}
          rowData={requirementSidebar.requirement}
          columns={getRequirementColumns()}
          onSave={handleSaveRequirement}
          onDelete={
            canAccess({ roles: ["pm"] }) ? handleArchiveRequirement : undefined
          }
          onCancel={() => setRequirementSidebar(null)}
          creating={requirementSidebar.mode === "create"}
          saving={creating || updatingContent}
          deleting={archiving}
        />
      )}

      {specSidebar && (
        <DataSidebar
          title={
            specSidebar.mode === "create"
              ? "Add Specification"
              : "Edit Specification"
          }
          icon={PlusCircleIcon}
          open
          onClose={() => setSpecSidebar(null)}
          rowData={specSidebar.spec}
          columns={getSpecColumns()}
          onSave={handleSaveSpec}
          onDelete={() =>
            showMessage("Deleting specifications is not supported yet.", "info")
          }
          onCancel={() => setSpecSidebar(null)}
          creating={specSidebar.mode === "create"}
          saving={creatingSpec || updatingSpec}
        />
      )}

      {statusModal && (
        <ActionModal
          open
          onClose={() => setStatusModal(null)}
          title={statusModal.transition.label}
          description={`Change "${statusModal.requirement.title}" from ${statusModal.requirement.status} to ${statusModal.transition.status}. This is recorded in the audit trail.`}
          confirmText={statusModal.transition.label}
          modalType={
            statusModal.transition.tone === "forward" ? "approve" : undefined
          }
          loading={advancingStatus}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
