// Login page — works for both admins and employees
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../core/api/auth";
import { useAuth } from "../../core/context/AuthContext";

interface FormData { email: string; password: string; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOADING_MSGS = [
  "Checking your vibe... 🕵️",
  "Verifying you're not a robot 🤖",
  "Asking the JWT gods 🙏",
  "Unlocking the vault 🔐",
];

export default function Login() {
  const { register, handleSubmit, control, formState: { errors, touchedFields } } = useForm<FormData>({ mode: "onChange" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const { setAuth }             = useAuth();
  const navigate                = useNavigate();

  // Pick a random loading message once per mount
  const [loadMsg] = useState(() => LOADING_MSGS[Math.floor(Math.random() * LOADING_MSGS.length)]);

  const email    = useWatch({ control, name: "email",    defaultValue: "" });
  const password = useWatch({ control, name: "password", defaultValue: "" });

  // Enable submit only when email looks valid and password is non-empty
  const formReady = EMAIL_RE.test(email) && password.length >= 1;

  const onSubmit = async (data: FormData) => {
    setApiError(""); setLoading(true);
    try {
      const res = await login(data.email, data.password);
      setAuth(res.user, res.token);
      navigate("/dashboard");
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg"><div className="auth-card">
      <div className="auth-logo">
        <div className="auth-logo-icon">🏭</div>
        <span className="auth-logo-text">WarehouseOS</span>
      </div>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">The warehouse is waiting. Let's get to work.</p>

      {apiError && <div className="alert alert-error"><span>⚠️</span> {apiError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="field-label">Email</label>
          <input
            className={`input${errors.email && touchedFields.email ? " input-error" : EMAIL_RE.test(email) && touchedFields.email ? " input-success" : ""}`}
            type="email" placeholder="you@company.com" autoComplete="email"
            {...register("email", { required: "Email is required", pattern: { value: EMAIL_RE, message: "Invalid email" } })} />
          {errors.email && touchedFields.email && <p className="field-error">⚠ {errors.email.message}</p>}
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <div className="input-wrap">
            <input className="input" type={showPw ? "text" : "password"} placeholder="••••••••"
              autoComplete="current-password" style={{ paddingRight: "2.5rem" }}
              {...register("password", { required: "Password is required" })} />
            <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Submit disabled until form is valid */}
        <button className="btn btn-primary btn-full" type="submit" disabled={!formReady || loading} style={{ marginTop: "0.5rem" }}>
          {loading ? <><span className="spinner" /> {loadMsg}</> : "Sign In →"}
        </button>
      </form>

      <div className="divider">new here?</div>
      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--gray-500)" }}>
        Got an invite? <Link to="/register/employee" style={{ fontWeight: 600 }}>Complete registration</Link>
      </p>
    </div></div>
  );
}
