import React, { useState } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router";
import { useProject, useProjectMutations } from "../../../../hooks/useProjects";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../../components/crud/noResult/NoResult";
import StatusBadge from "../../../../components/status/statusBadge/StatusBadge";
import Button from "../../../../components/buttons/button/Button";
import DataSidebar from "../../../../components/dataSidebar/DataSidebar";
import { getProjectColumns } from "../config/projectFormConfig";
import {
  ChartLineIcon,
  FolderSimpleIcon,
  ListIcon,
  PencilSimpleIcon,
  FlowArrowIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react";
import { useAccessControl } from "../../../../context/AccessControlContext";
import { useMessage } from "../../../../context/MessageContext";
import LinkButton from "../../../../components/buttons/linkButton/LinkButton";
import RouterButton from "../../../../components/buttons/routerButton/RouterButton";

export default function ProjectDetailLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, isLoading, error } = useProject(projectId);
  const { canAccess, isPm, isClient } = useAccessControl();
  const { showMessage } = useMessage();
  const [editingProject, setEditingProject] = useState(false);
  const { updateProject, updating, archiveProject, archiving } =
    useProjectMutations();

  async function handleSaveProject(formData) {
    await updateProject({
      projectId,
      updates: {
        name: formData.name,
        description: formData.description,
        client_id: formData.client_id?.value,
        status: formData.status || undefined,
      },
    });
    setEditingProject(false);
  }

  async function handleArchiveProject() {
    await archiveProject(projectId);
    setEditingProject(false);
    navigate("/pm/projects");
  }

  return (
    <>
      {isLoading ? (
        <LoadingIcon />
      ) : error ? (
        <NoResult title="Error loading project" />
      ) : !project ? (
        <NoResult title="Project not found." />
      ) : (
        <div className="pageLayout">
          <RouterButton
            icon2={CaretLeftIcon}
            name="All Projects"
            to="../"
            style="button buttonType5 textXXS"
          />

          {/* ── 1. Page Header & Actions ───────────────────────────────────── */}
          <PageHeader>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h1 className="textL textBold">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>

              <h3 className="textXS">Description</h3>
              <p className="textXXS textLight">{project.description}</p>
            </div>

            {canAccess({ roles: ["pm"] }) && (
              <Button
                style="button buttonType5 textXXS"
                onClick={() => setEditingProject(true)}
                name="Edit Project"
                icon={PencilSimpleIcon}
                weight="fill"
              />
            )}
          </PageHeader>

          {isPm && (
            <div className="pageTabContainer">
              {/* REQUIREMENTS AND SPECIFICATIONS */}
              <NavLink
                to="."
                className={({ isActive }) =>
                  `button buttonTypeTab textRegular textXS ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <div className="pageTabIcon">
                  <FolderSimpleIcon size={15} />
                </div>
                Project Details
              </NavLink>

              {/* TASKS */}
              <NavLink
                to="./tasks"
                className={({ isActive }) =>
                  `button buttonTypeTab textRegular textXS ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <div className="pageTabIcon">
                  <ListIcon size={15} />
                </div>
                Tasks
              </NavLink>

              {/* TASK GRAPH */}
              <NavLink
                to="./task-graph"
                className={({ isActive }) =>
                  `button buttonTypeTab textRegular textXS ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <div className="pageTabIcon">
                  <FlowArrowIcon size={15} />
                </div>
                Task Graph
              </NavLink>

              {/* CRITICAL PATH */}
              <NavLink
                to="./critical-path"
                className={({ isActive }) =>
                  `button buttonTypeTab textRegular textXS ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <div className="pageTabIcon">
                  <ChartLineIcon size={15} />
                </div>
                Critical Path
              </NavLink>
            </div>
          )}

          <Outlet />

          {editingProject && (
            <DataSidebar
              title="Edit Project"
              icon={PencilSimpleIcon}
              open
              onClose={() => setEditingProject(false)}
              rowData={project}
              columns={getProjectColumns({ includeStatus: true, showMessage })}
              onSave={handleSaveProject}
              onDelete={handleArchiveProject}
              onCancel={() => setEditingProject(false)}
              saving={updating}
              deleting={archiving}
            />
          )}
        </div>
      )}
    </>
  );
}
