import { supabase } from "../lib/supabaseClient";
import { apiClient } from "../lib/apiClient";

// Registration goes to Express backend. Client-only — the backend hardcodes
// role: "client" regardless of what's sent, so there's no role param here.
export async function registerUser({ email, password, full_name }) {
  return apiClient("/api/auth/register", {
    method: "POST",
    body: { email, password, full_name },
  });
  // Returns { message, user: { id, email, full_name, role } }
}

// Login goes directly to Supabase
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data; // { session, user }
}

// Fetch enriched profile from Express (has role from profiles table)
export async function fetchMe() {
  return apiClient("/api/auth/me");
  // Returns { user: { id, email, role, full_name } }
}

// pm-only. Creates a pm or member account with a system-generated password —
// there's no email/SMTP infrastructure in this project to invite users by
// link. The password is returned once and must be relayed to the new user
// out-of-band; it is never retrievable again after this call.
export async function createTeamMember({ email, full_name, role }) {
  return apiClient("/api/auth/team", {
    method: "POST",
    body: { email, full_name, role },
  });
  // Returns { user: { id, email, full_name, role }, temporary_password: string }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
