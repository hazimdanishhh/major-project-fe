import React from "react";
import { NavLink, Outlet, useParams } from "react-router";
import { useProject } from "../../../../hooks/useProjects";
import PageHeader from "../../../../components/crud/pageHeader/PageHeader";
import LoadingIcon from "../../../../components/loadingIcon/LoadingIcon";
import NoResult from "../../../../components/crud/noResult/NoResult";
import StatusBadge from "../../../../components/status/statusBadge/StatusBadge";
import {
  ChartLineIcon,
  FolderSimpleIcon,
  ListIcon,
} from "@phosphor-icons/react";
import { useAccessControl } from "../../../../context/AccessControlContext";

export default function ProjectDetailLayout() {
  const { projectId } = useParams();
  const { project, isLoading, error } = useProject(projectId);
  const { canAccess, isPm, isClient } = useAccessControl();

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
          </PageHeader>
          <Outlet />
        </div>
      )}
    </>
  );
}
