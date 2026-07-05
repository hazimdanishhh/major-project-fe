// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loginUser, fetchMe } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.scss";
import { useMessage } from "../../context/MessageContext";

// Same email pattern as RegisterPage — kept in sync by hand.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  async function onSubmit({ email, password }) {
    setSubmitError("");
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
      setSubmitError(err.message);
      showMessage("Error logging in", "error");
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

          <form onSubmit={handleSubmit(onSubmit)} className="loginCardForm" noValidate>
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: EMAIL_PATTERN, message: "Invalid email address" },
                  maxLength: {
                    value: 254,
                    message: "Email must be at most 254 characters",
                  },
                })}
              />
              {errors.email && <p className="textXXS fieldError">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "Password is required",
                  maxLength: {
                    value: 128,
                    message: "Password must be at most 128 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="textXXS fieldError">{errors.password.message}</p>
              )}
            </div>

            {submitError && <p className="textXXS fieldError">{submitError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="button buttonType4"
            >
              {isSubmitting ? "Logging in..." : "Login"}
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
