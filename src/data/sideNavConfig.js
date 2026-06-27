// src/data/sideNavConfig.js
//
// Each segment has a title, code (shown when sidenav is collapsed),
// and an array of links. Each link may declare `roles: ['pm', 'client']`
// to restrict visibility. Omitting `roles` means all authenticated users see it.
//
// Paths are relative to the role prefix — SideNavLink handles the base path.
// e.g. path: "projects" → navigates to /pm/projects (for a pm user)

import {
  FolderIcon,
  ListChecksIcon,
  UsersIcon,
  HouseIcon,
  UserCircleIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";

// ─── Role home paths (used by PublicRoute redirect and after login) ────────────
export const ROLE_HOME = {
  pm: "/pm/projects",
  client: "/client/projects",
  member: "/member/tasks",
};

// ─── Role base paths (prefix for all sidenav links) ───────────────────────────
export const ROLE_BASE = {
  pm: "/pm",
  client: "/client",
  member: "/member",
};

// ─── Navigation config ────────────────────────────────────────────────────────
export const sideNavConfig = [
  // ── General (all roles) ───────────────────────────────────────────────────
  {
    segmentTitle: null,
    segmentCode: null,
    links: [
      {
        label: "Dashboard",
        icon: HouseIcon,
        path: "dashboard",
        // no roles = visible to all authenticated users
      },
      {
        label: "Profile",
        icon: UserCircleIcon,
        path: "profile",
      },
    ],
  },

  // ── Projects (pm + client see projects; members see tasks) ────────────────
  {
    segmentTitle: "PROJECT MANAGEMENT",
    segmentCode: "PM",
    links: [
      {
        label: "Projects",
        icon: FolderIcon,
        path: "projects",
        roles: ["pm", "client"],
      },
      {
        label: "Tasks",
        icon: ListChecksIcon,
        path: "tasks",
        roles: ["pm", "member"],
      },
      {
        label: "My Tasks",
        icon: ListChecksIcon,
        path: "my-tasks",
        roles: ["member"],
      },
    ],
  },

  // ── PM-only tools ─────────────────────────────────────────────────────────
  {
    segmentTitle: "TOOLS",
    segmentCode: "TOOLS",
    links: [
      {
        label: "Traceability",
        icon: ChartBarIcon,
        path: "traceability",
        roles: ["pm"],
      },
      {
        label: "Team",
        icon: UsersIcon,
        path: "team",
        roles: ["pm"],
      },
    ],
  },
];
