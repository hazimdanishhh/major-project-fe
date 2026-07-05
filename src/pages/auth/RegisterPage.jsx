// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registerUser, loginUser, fetchMe } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useMessage } from "../../context/MessageContext";
import "./LoginPage.scss";

// Mirrors the backend's RegisterSchema (major-project-be/src/routes/authRoutes.js)
// so client and server validation never disagree.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}][\p{L} '.-]*$/u;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showMessage } = useMessage();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const password = watch("password");

  async function onSubmit(formData) {
    setSubmitError("");
    try {
      // 1. Register via Express (client-only — role is hardcoded server-side)
      await registerUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });

      // 2. Login via Supabase to get a session
      await loginUser({ email: formData.email, password: formData.password });

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
      setSubmitError(err.message);
      showMessage("Error registering", "error");
    }
  }

  return (
    <section className="sectionLight">
      <div className="sectionWrapper loginCardWrapper">
        <div className="loginCardContainer">
          <div className="loginCardHeader">
            <img src="./favicon.svg" alt="Logo" className="loginCardLogo" />
            <h2 className="textM textRegular">Register</h2>
            <p className="textXXS textLight">Create your client account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="loginCardForm" noValidate>
            <div>
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                placeholder="Jane Doe"
                {...register("full_name", {
                  required: "Full name is required",
                  minLength: {
                    value: 2,
                    message: "Full name must be at least 2 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Full name must be at most 100 characters",
                  },
                  pattern: {
                    value: NAME_PATTERN,
                    message:
                      "Full name can only contain letters, spaces, apostrophes, and hyphens",
                  },
                })}
              />
              {errors.full_name && (
                <p className="textXXS fieldError">{errors.full_name.message}</p>
              )}
            </div>

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
                  minLength: {
                    value: 10,
                    message: "Password must be at least 10 characters",
                  },
                  maxLength: {
                    value: 72,
                    message: "Password must be at most 72 characters",
                  },
                  validate: {
                    hasUpper: (v) =>
                      /[A-Z]/.test(v) || "Password must contain an uppercase letter",
                    hasLower: (v) =>
                      /[a-z]/.test(v) || "Password must contain a lowercase letter",
                    hasNumber: (v) => /[0-9]/.test(v) || "Password must contain a number",
                    hasSpecial: (v) =>
                      /[^A-Za-z0-9]/.test(v) || "Password must contain a special character",
                  },
                })}
              />
              {errors.password && (
                <p className="textXXS fieldError">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                placeholder="••••••••"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (v) => v === password || "Passwords do not match",
                })}
              />
              {errors.confirm_password && (
                <p className="textXXS fieldError">{errors.confirm_password.message}</p>
              )}
            </div>

            {submitError && <p className="textXXS fieldError">{submitError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="button buttonType4"
            >
              {isSubmitting ? "Registering..." : "Register"}
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
