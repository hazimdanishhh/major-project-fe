// src/context/AccessControlContext.jsx
//
// Reads the already-fetched user from AuthContext (which called GET /api/auth/me)
// and exposes:
//   - canAccess({ roles })   → boolean, use this everywhere in components
//   - isPm, isClient, isMember → convenience booleans
//   - navigation             → filtered sidenav segments based on user role
//
// No Supabase calls here. No ProfileContext needed.
// AuthContext already has { id, email, role, full_name } from /api/auth/me.

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { sideNavConfig } from "../data/sideNavConfig";

const AccessControlContext = createContext(null);

export function AccessControlProvider({ children }) {
  const { user, loading } = useAuth();

  const role = user?.role ?? null; // 'pm' | 'client' | 'member' | null

  // ─── Role booleans ────────────────────────────────────────────────────────
  const isPm = role === "pm";
  const isClient = role === "client";
  const isMember = role === "member";

  // ─── Core access checker ──────────────────────────────────────────────────
  // Usage in a component:
  //   const { canAccess } = useAccessControl()
  //   {canAccess({ roles: ['pm'] }) && <button>Add Project</button>}
  //
  // Pass an empty roles array (or omit it) to allow any authenticated user.
  function canAccess({ roles = [] } = {}) {
    if (!user) return false; // not logged in
    if (roles.length === 0) return true; // no restriction — any auth user
    return roles.includes(role);
  }

  // ─── Filtered navigation for SideNav ──────────────────────────────────────
  // sideNavConfig is an array of segment objects. Each link declares `roles`.
  // Links with no `roles` array are visible to everyone that is logged in.
  const navigation = useMemo(() => {
    if (!user) return [];

    return sideNavConfig
      .map((segment) => ({
        ...segment,
        links: segment.links.filter((link) =>
          canAccess({ roles: link.roles ?? [] }),
        ),
      }))
      .filter((segment) => segment.links.length > 0);
  }, [role]); // re-derive only when role changes

  return (
    <AccessControlContext.Provider
      value={{
        role,
        loading,
        isPm,
        isClient,
        isMember,
        canAccess,
        navigation,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const ctx = useContext(AccessControlContext);
  if (!ctx)
    throw new Error(
      "useAccessControl must be used inside AccessControlProvider",
    );
  return ctx;
}
