export function getFilterConfig() {
  return [
    // {
    //   key: "pm_id",
    //   label: "Owner",
    //   options: owners.map((c) => ({ label: c.full_name, value: c.id })),
    // },
    // {
    //   key: "client_id",
    //   label: "Client",
    //   options: clients.map((s) => ({ label: s.name, value: s.id })),
    // },
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "On Hold", value: "ON_HOLD" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Archived", value: "ARCHIVED" },
      ],
    },
  ];
}
