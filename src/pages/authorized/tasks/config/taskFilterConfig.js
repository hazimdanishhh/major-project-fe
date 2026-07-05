import { fetchUsers, filterMembers } from "../../../../services/userService";
import { fetchProjects, fetchProject } from "../../../../services/projectService";
import { fetchRequirements } from "../../../../services/requirementService";

// scope: "all" -> adds a Project filter (PM All Tasks page).
//        "project" -> adds a Requirement filter scoped to `projectId`
//        (project-nested Tasks page, where the project is already fixed by
//        the URL so filtering by project again would be redundant).
export function getFilterConfig({ scope = "all", projectId, showMessage } = {}) {
  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Blocked", value: "BLOCKED" },
        { label: "To Do", value: "TO_DO" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Done", value: "DONE" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      options: [
        { label: "Low", value: "LOW" },
        { label: "Medium", value: "MEDIUM" },
        { label: "High", value: "HIGH" },
        { label: "Critical", value: "CRITICAL" },
      ],
    },
    {
      key: "assignee_id",
      label: "Assignee",
      editor: "asyncSelect",
      loadOptions: async (search) => {
        try {
          const { users } = await fetchUsers();
          const term = (search || "").toLowerCase();
          return filterMembers(users)
            .filter((u) => (u.full_name || "").toLowerCase().includes(term))
            .map((u) => ({ label: u.full_name, value: u.id }));
        } catch (err) {
          showMessage?.(err.message, "error");
          return [];
        }
      },
      getOptionByValue: async (value) => {
        try {
          const { users } = await fetchUsers();
          const match = users.find((u) => u.id === value);
          return match ? { label: match.full_name, value: match.id } : null;
        } catch {
          return null;
        }
      },
      getDisplayValue: async (value) => {
        try {
          const { users } = await fetchUsers();
          return users.find((u) => u.id === value)?.full_name || value;
        } catch {
          return value;
        }
      },
    },
  ];

  if (scope === "all") {
    filters.push({
      key: "project_id",
      label: "Project",
      editor: "asyncSelect",
      loadOptions: async (search) => {
        try {
          const { data: projects } = await fetchProjects({
            page: 1,
            pageSize: 50,
            search,
          });
          return (projects || []).map((p) => ({ label: p.name, value: p.id }));
        } catch (err) {
          showMessage?.(err.message, "error");
          return [];
        }
      },
      getOptionByValue: async (value) => {
        try {
          const { project } = await fetchProject(value);
          return project ? { label: project.name, value: project.id } : null;
        } catch {
          return null;
        }
      },
      getDisplayValue: async (value) => {
        try {
          const { project } = await fetchProject(value);
          return project?.name || value;
        } catch {
          return value;
        }
      },
    });
  } else if (scope === "project" && projectId) {
    filters.push({
      key: "requirement_id",
      label: "Requirement",
      editor: "asyncSelect",
      loadOptions: async (search) => {
        try {
          const { requirements } = await fetchRequirements({
            project_id: projectId,
          });
          const term = (search || "").toLowerCase();
          return requirements
            .filter((r) => (r.title || "").toLowerCase().includes(term))
            .map((r) => ({ label: r.title, value: r.id }));
        } catch (err) {
          showMessage?.(err.message, "error");
          return [];
        }
      },
      getOptionByValue: async (value) => {
        try {
          const { requirements } = await fetchRequirements({
            project_id: projectId,
          });
          const match = requirements.find((r) => r.id === value);
          return match ? { label: match.title, value: match.id } : null;
        } catch {
          return null;
        }
      },
      getDisplayValue: async (value) => {
        try {
          const { requirements } = await fetchRequirements({
            project_id: projectId,
          });
          return requirements.find((r) => r.id === value)?.title || value;
        } catch {
          return value;
        }
      },
    });
  }

  return filters;
}
