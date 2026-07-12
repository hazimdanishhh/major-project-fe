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
  UserCircleIcon,
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
  // Dashboard was dropped from here — no route exists for it on any role's
  // tree, and building an actual dashboard is separate, larger work than this
  // nav-link cleanup. Re-add once that page actually exists.
  {
    segmentTitle: null,
    segmentCode: null,
    links: [
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
    ],
  },

  // ── PM-only tools ─────────────────────────────────────────────────────────
  {
    segmentTitle: "TOOLS",
    segmentCode: "TOOLS",
    links: [
      {
        label: "Team",
        icon: UsersIcon,
        path: "team",
        roles: ["pm"],
      },
    ],
  },
];
