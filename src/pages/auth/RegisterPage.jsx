// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { fetchMe } from "../../services/authService";
import { useMessage } from "../../context/MessageContext";
import "./LoginPage.scss";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "member",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

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
      showMessage("Registered successfully", "success");
    } catch (err) {
      setError(err.message);
      showMessage("Error registering", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sectionLight">
      <div className="sectionWrapper loginCardWrapper">
        <div className="loginCardContainer">
          <div className="loginCardHeader">
            <img src="./favicon.svg" alt="Logo" className="loginCardLogo" />
            <h2 className="textM textRegular">Register</h2>
            <p className="textXXS textLight">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="loginCardForm">
            <div>
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="client">Client</option>
                <option value="pm">Project Manager</option>
                <option value="member">Member</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button buttonType4"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="textS textLight">
            Already have an account?{" "}
            <Link to="/login" className="textBold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
