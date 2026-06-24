// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { fetchMe } from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "member",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Register via Express (creates auth user + profiles row)
      await registerUser(form);

      // 2. Login via Supabase to get a session
      await loginUser({ email: form.email, password: form.password });

      // 3. Fetch enriched profile (role etc) from Express
      const { user: profile } = await fetchMe();
      setUser(profile);

      // 4. Navigate to role-appropriate home
      const home = {
        pm: "/pm/projects",
        client: "/client/projects",
        member: "/member/tasks",
      };
      navigate(home[profile.role] ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  // ... render form using your existing form components
}
