// role is restricted to pm/member here — clients always self-register via
// the public /register page, never through the Team screen.
export function getTeamMemberColumns() {
  return [
    {
      key: "full_name",
      label: "Full Name",
      section: "Team Member",
      editor: "text",
      required: true,
      editable: true,
      accessor: "full_name",
    },
    {
      key: "email",
      label: "Email",
      section: "Team Member",
      editor: "text",
      required: true,
      editable: true,
      accessor: "email",
    },
    {
      key: "role",
      label: "Role",
      section: "Team Member",
      editor: "select",
      required: true,
      editable: true,
      options: [
        { label: "Project Manager", value: "pm" },
        { label: "Member", value: "member" },
      ],
      accessor: "role",
    },
  ];
}
