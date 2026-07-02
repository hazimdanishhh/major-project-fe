import { fetchUsers, filterClients } from "../../../../services/userService";

// Columns for the New/Edit Project DataForm.
// `includeStatus` is false for create (status is server-set to ACTIVE on
// creation — see projectController.createProject) and true for edit.
export function getProjectColumns({ includeStatus = false } = {}) {
  return [
    {
      key: "name",
      label: "Name",
      section: "Project",
      editor: "text",
      required: true,
      editable: true,
      accessor: "name",
    },
    {
      key: "description",
      label: "Description",
      section: "Project",
      editor: "textarea",
      required: false,
      editable: true,
      accessor: "description",
    },
    {
      key: "client_id",
      label: "Client",
      section: "Project",
      editor: "asyncSelect",
      required: true,
      editable: true,
      // asyncSelect needs a {label, value} object, not a raw id, to display
      // the currently-selected client when editing.
      getValue: (rowData) =>
        rowData?.client
          ? { label: rowData.client.full_name, value: rowData.client.id }
          : null,
      loadOptions: async (search) => {
        const { users } = await fetchUsers();
        const term = (search || "").toLowerCase();
        return filterClients(users)
          .filter((u) => u.full_name.toLowerCase().includes(term))
          .map((u) => ({ label: u.full_name, value: u.id }));
      },
    },
    {
      key: "status",
      label: "Status",
      section: "Project",
      editor: "select",
      required: false,
      editable: true,
      show: includeStatus,
      half: true,
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "On Hold", value: "ON_HOLD" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Archived", value: "ARCHIVED" },
      ],
      accessor: "status",
    },
  ];
}
