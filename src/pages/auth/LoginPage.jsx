// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, fetchMe } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.scss";
import { useMessage } from "../../context/MessageContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      // 1. Login via Supabase SDK
      await loginUser({ email, password });
      showMessage("Logging in...", "loading");

      // 2. GET /api/auth/me to get role + profile
      const { user: profile } = await fetchMe();
      setUser(profile);

      // 3. Role-based redirect
      const home = {
        pm: "/pm/projects",
        client: "/client/projects",
        member: "/member/tasks",
      };
      navigate(home[profile.role] ?? "/dashboard", { replace: true });
      showMessage("Logged in successfully", "success");
    } catch (err) {
      setError(err.message);
      showMessage("Error logging in", "error");
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
            <h2 className="textM textRegular">Login</h2>
            <p className="textXXS textLight">Welcome back!</p>
          </div>

          <form onSubmit={handleSubmit} className="loginCardForm">
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@example.com"
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button buttonType4"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="textS textLight">
            Don't have an account?{" "}
            <Link to="/register" className="textBold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
