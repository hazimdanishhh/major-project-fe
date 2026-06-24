import { supabase } from "../lib/supabaseClient";
import { apiClient } from "../lib/apiClient";

// Registration goes to Express backend (needs service-role to set role in profiles)
export async function registerUser({ email, password, full_name, role }) {
  return apiClient("/api/auth/register", {
    method: "POST",
    body: { email, password, full_name, role },
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

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
