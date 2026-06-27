// src/context/AuthContext.jsx
//
// Responsibilities:
//   1. On mount: check for an existing Supabase session. If found, call
//      GET /api/auth/me to get the enriched profile (with role from profiles table).
//   2. Listen to Supabase auth state changes (login/logout).
//   3. Expose: user, loading, setUser, logout.
//
// user shape: { id, email, role, full_name }  — exactly what /api/auth/me returns.
// role is 'pm' | 'client' | 'member' — comes from the profiles table via Express.
//
// NOTE: We do NOT call Supabase directly to get the profile/role here.
// The Express backend is the source of truth for role — it reads from
// the profiles table using the service-role key.

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user = { id, email, role, full_name } | null
  const [user, setUser] = useState(null);
  // loading = true while we are checking the initial session on mount
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Step 1: Check for existing session on page load / refresh ───────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        try {
          const { user: profile } = await fetchMe();
          setUser(profile);
        } catch {
          // Token exists but /api/auth/me failed (profile missing, token bad, etc.)
          // Treat as logged out rather than crashing the app.
          setUser(null);
          await supabase.auth.signOut();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // ── Step 2: Keep in sync with Supabase auth events ──────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.access_token) {
        try {
          const { user: profile } = await fetchMe();
          setUser(profile);
        } catch {
          setUser(null);
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
      }

      // TOKEN_REFRESHED fires silently — no need to re-fetch /me,
      // the user object hasn't changed, only the token.
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null); // onAuthStateChange will also fire SIGNED_OUT, but this is instant
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {/* Render nothing until the initial session check is done.
          This prevents a flash of the login page on refresh for logged-in users. */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
