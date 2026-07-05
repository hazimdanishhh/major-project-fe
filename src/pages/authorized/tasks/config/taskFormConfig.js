import { fetchUsers, filterMembers } from "../../../../services/userService";
import { fetchProjects } from "../../../../services/projectService";
import { fetchRequirements } from "../../../../services/requirementService";

// Columns for the New/Edit Task DataForm.
//
// requirement_id is create-only — UpdateTaskSchema has no requirement_id
// field, so a task's requirement can never change after creation. When
// `isEditing`, it's rendered disabled and prefilled from rowData.requirement.
//
// When creating with a known `projectId` (project-nested Tasks page), the
// requirement dropdown is scoped directly to that project. When creating
// with no `projectId` (PM All Tasks page), a transient UI-only `project_id`
// field is added first, and requirement_id cascades off it via
// DataForm's dependsOn/clears mechanism (see components/crud/dataForm/DataForm.jsx).
//
// No dependency-editor fields here — dependency management is a separate
// future phase (graph UI), not part of this create/edit form.
export function getTaskColumns({ projectId, isEditing = false, showMessage } = {}) {
  const columns = [
    {
      key: "title",
      label: "Title",
      section: "Task",
      editor: "text",
      required: true,
      editable: true,
      accessor: "title",
    },
    {
      key: "description",
      label: "Description",
      section: "Task",
      editor: "textarea",
      required: false,
      editable: true,
      accessor: "description",
    },
  ];

  if (isEditing) {
    columns.push({
      key: "requirement_id",
      label: "Requirement",
      section: "Task",
      editor: "asyncSelect",
      required: true,
      editable: false,
      getValue: (rowData) =>
        rowData?.requirement
          ? { label: rowData.requirement.title, value: rowData.requirement.id }
          : null,
      loadOptions: async () => [],
    });
  } else if (projectId) {
    columns.push({
      key: "requirement_id",
      label: "Requirement",
      section: "Task",
      editor: "asyncSelect",
      required: true,
      editable: true,
      getValue: () => null,
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
    });
  } else {
    columns.push(
      {
        key: "project_id",
        label: "Project",
        section: "Task",
        editor: "asyncSelect",
        required: true,
        editable: true,
        clears: ["requirement_id"],
        getValue: () => null,
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
      },
      {
        key: "requirement_id",
        label: "Requirement",
        section: "Task",
        editor: "asyncSelect",
        required: true,
        editable: true,
        dependsOn: ["project_id"],
        getValue: () => null,
        loadOptions: async (search, currentFormValues) => {
          const selectedProjectId = currentFormValues?.project_id?.value;
          if (!selectedProjectId) return [];
          try {
            const { requirements } = await fetchRequirements({
              project_id: selectedProjectId,
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
      },
    );
  }

  columns.push(
    {
      key: "assignee_id",
      label: "Assignee",
      section: "Task",
      editor: "asyncSelect",
      required: false,
      editable: true,
      isClearable: true,
      getValue: (rowData) =>
        rowData?.assignee
          ? { label: rowData.assignee.full_name, value: rowData.assignee.id }
          : null,
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
    },
    {
      key: "estimated_hours",
      label: "Estimated Hours",
      section: "Task",
      editor: "number",
      required: false,
      editable: true,
      half: true,
      min: 0,
      max: 999,
      step: 1,
      accessor: "estimated_hours",
    },
    {
      key: "priority",
      label: "Priority",
      section: "Task",
      editor: "select",
      required: false,
      editable: true,
      half: true,
      options: [
        { label: "Low", value: "LOW" },
        { label: "Medium", value: "MEDIUM" },
        { label: "High", value: "HIGH" },
        { label: "Critical", value: "CRITICAL" },
      ],
      accessor: "priority",
    },
  );

  // Only meaningful once a task exists — lets a pm manually clear a stale
  // at-risk flag after verifying the impacted work is fine.
  if (isEditing) {
    columns.push({
      key: "is_at_risk",
      label: "At Risk",
      section: "Task",
      editor: "select",
      required: false,
      editable: true,
      half: true,
      isClearable: false,
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
      getValue: (rowData) => (rowData?.is_at_risk ? "true" : "false"),
    });
  }

  return columns;
}
