// src/pages/authorized/projects/ProjectsPage.jsx

import { useState } from "react";
import { FolderPlusIcon } from "@phosphor-icons/react";
import { useAccessControl } from "../../../context/AccessControlContext";
import { useMessage } from "../../../context/MessageContext";

// --- Hooks & Services ---
import usePaginatedQuery from "../../../hooks/usePaginatedQuery";
import { useProjectMutations } from "../../../hooks/useProjects";
import { fetchProjects } from "../../../services/projectService";

// --- Components ---
import Button from "../../../components/buttons/button/Button";
import CardLayout from "../../../components/cardLayout/CardLayout";
import ActiveFiltersBar from "../../../components/crud/activeFiltersBar/ActiveFiltersBar";
import DataSidebar from "../../../components/dataSidebar/DataSidebar";
import NoResult from "../../../components/crud/noResult/NoResult";
import PageHeader from "../../../components/crud/pageHeader/PageHeader";
import PageResult from "../../../components/crud/pageResult/PageResult";
import SearchFilterBar from "../../../components/crud/searchFilterBar/SearchFilterBar";
import SortBar from "../../../components/crud/sortBar/SortBar";
import LoadingIcon from "../../../components/loadingIcon/LoadingIcon";
import ProjectCard from "../../../components/projects/projectCard/ProjectCard";
import { getFilterConfig } from "./config/filterConfig";
import { getSortConfig } from "./config/sortConfig";
import { getProjectColumns } from "./config/projectFormConfig";

export default function ProjectsPage() {
  const { canAccess, isPm } = useAccessControl();
  const { showMessage } = useMessage();
  const [creatingProject, setCreatingProject] = useState(false);
  const { createProject, creating } = useProjectMutations();

  // =========================
  // DATA FETCHING
  // =========================
  const {
    data: projects,
    totalCount,
    page,
    totalPages,
    search,
    filters,
    sortBy,
    sortOrder,
    activeFilters,
    hasActiveFilters,
    setPage,
    setSearch,
    setFilters,
    setSortBy,
    setSortOrder,
    resetParams,
    isLoading,
    isFetching,
    error,
  } = usePaginatedQuery({
    queryKey: "projects",
    queryFn: fetchProjects,
    pageSize: 20,
    defaultSortBy: "created_at",
    defaultSortOrder: "descending",
  });

  // CONFIG
  const filterConfig = getFilterConfig();
  const sortConfig = getSortConfig();

  const hasData = projects?.length > 0;

  async function handleSaveProject(formData) {
    await createProject({
      name: formData.name,
      description: formData.description,
      client_id: formData.client_id?.value,
    });
    setCreatingProject(false);
  }

  return (
    <div className="pageLayout">
      {/* ── 1. Page Header & Actions ───────────────────────────────────── */}
      <PageHeader>
        <div>
          <h1 className="textL textBold">Projects</h1>
          <p className="textXXS textLight">
            {isPm
              ? "Manage all projects."
              : "View projects you are assigned to."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <SortBar
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOptions={sortConfig}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {canAccess({ roles: ["pm"] }) && (
            <Button
              style="button buttonType5 approval textXXS"
              onClick={() => setCreatingProject(true)}
              name="New Project"
              icon2={FolderPlusIcon}
              weight="fill"
            />
          )}
        </div>
      </PageHeader>

      {/* ── 2. Search & Filter Bar ──────────────────────────────────────── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        filterConfig={filterConfig}
        placeholder="Search projects..."
      />

      {/* ── 3. Active Filters (Only shows if filters applied) ──────────── */}
      {hasActiveFilters && (
        <ActiveFiltersBar
          search={search}
          setSearch={setSearch}
          filters={activeFilters}
          setFilters={setFilters}
          filterConfig={filterConfig}
          resetParams={resetParams}
        />
      )}

      {/* ── 4. Pagination / Result Counter ──────────────────────────────── */}
      <PageResult
        data={projects}
        totalCount={totalCount}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        error={error}
      />

      {/* ── 5. Main Data Display ────────────────────────────────────────── */}
      <CardLayout style="cardWrapperScroll generalCard">
        {isLoading || isFetching ? (
          <CardLayout style="cardLayoutFlexFull">
            <LoadingIcon />
          </CardLayout>
        ) : error ? (
          <NoResult title="Error loading projects" />
        ) : !hasData ? (
          <NoResult title="No projects found." />
        ) : (
          <CardLayout style="cardLayout2 cardPaddingSmall cardGapSmall">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </CardLayout>
        )}
      </CardLayout>

      {creatingProject && (
        <DataSidebar
          title="New Project"
          icon={FolderPlusIcon}
          open
          onClose={() => setCreatingProject(false)}
          rowData={{}}
          columns={getProjectColumns({ showMessage })}
          onSave={handleSaveProject}
          onCancel={() => setCreatingProject(false)}
          creating
          saving={creating}
        />
      )}
    </div>
  );
}
