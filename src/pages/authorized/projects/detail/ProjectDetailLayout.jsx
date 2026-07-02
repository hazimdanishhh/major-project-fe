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
} from "@phosphor-icons/react";
import { useAccessControl } from "../../../../context/AccessControlContext";

export default function ProjectDetailLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, isLoading, error } = useProject(projectId);
  const { canAccess, isPm, isClient } = useAccessControl();
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
          <h1 className="textL textBold">Project Detail</h1>

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
            </div>
          )}

          {/* ── 1. Page Header & Actions ───────────────────────────────────── */}
          <PageHeader>
            <div>
              <StatusBadge status={project.status} />

              <h2 className="textM textBold">{project.name}</h2>

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
          <Outlet />

          {editingProject && (
            <DataSidebar
              title="Edit Project"
              icon={PencilSimpleIcon}
              open
              onClose={() => setEditingProject(false)}
              rowData={project}
              columns={getProjectColumns({ includeStatus: true })}
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
