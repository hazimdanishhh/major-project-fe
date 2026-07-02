// project_id, status, and current_version are server/FSM-managed — not
// exposed as editable fields here.
export function getRequirementColumns() {
  return [
    {
      key: "title",
      label: "Title",
      section: "Requirement",
      editor: "text",
      required: true,
      editable: true,
      accessor: "title",
    },
    {
      key: "description",
      label: "Description",
      section: "Requirement",
      editor: "textarea",
      required: false,
      editable: true,
      accessor: "description",
    },
  ];
}

export function getSpecColumns() {
  return [
    {
      key: "title",
      label: "Title",
      section: "Specification",
      editor: "text",
      required: true,
      editable: true,
      accessor: "title",
    },
    {
      key: "description",
      label: "Description",
      section: "Specification",
      editor: "textarea",
      required: true,
      editable: true,
      accessor: "description",
    },
    {
      key: "acceptance_criteria",
      label: "Acceptance Criteria",
      section: "Specification",
      editor: "textarea",
      required: false,
      editable: true,
      accessor: "acceptance_criteria",
    },
    {
      key: "complexity_score",
      label: "Complexity Score (0-10)",
      section: "Specification",
      editor: "number",
      required: false,
      editable: true,
      half: true,
      min: 0,
      max: 10,
      step: 1,
      accessor: "complexity_score",
    },
    {
      key: "status",
      label: "Status",
      section: "Specification",
      editor: "select",
      required: true,
      editable: true,
      half: true,
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Final", value: "FINAL" },
      ],
      accessor: "status",
    },
  ];
}
