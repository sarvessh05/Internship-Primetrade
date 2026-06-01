// Admin registration page — one-time setup, requires ADMIN_SECRET from .env
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { registerAdmin, login } from "../../core/api/auth";
import PasswordStrength, { PASSWORD_RULES, getStrength } from "../../components/common/PasswordStrength";
import { useAuth } from "../../core/context/AuthContext";

interface FormData { name: string; email: string; password: string; confirmPassword: string; }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminRegister() {
  const { register, handleSubmit, control, formState: { errors, touchedFields } } = useForm<FormData>({ mode: "onChange" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const { setAuth }             = useAuth();
  const navigate = useNavigate();

  const password        = useWatch({ control, name: "password",        defaultValue: "" });
  const confirmPassword = useWatch({ control, name: "confirmPassword", defaultValue: "" });
  const name            = useWatch({ control, name: "name",            defaultValue: "" });
  const email           = useWatch({ control, name: "email",           defaultValue: "" });

  const allRulesMet    = PASSWORD_RULES.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // All fields must be valid before the submit button activates
  const formReady = name.trim().length >= 2 && EMAIL_RE.test(email) && allRulesMet && passwordsMatch;

  const onSubmit = async (data: FormData) => {
    setApiError(""); setLoading(true);
    try {
      // 1. Create the admin
      await registerAdmin(data.name, data.email, data.password);
      
      // 2. Automatically log in the admin
      const authRes = await login(data.email, data.password);
      setAuth(authRes.user, authRes.token);
      
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      const d = err.response?.data;
      setApiError(d?.errors?.length ? d.errors.map((e: any) => e.message).join(" · ") : d?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  // Success screen shown briefly before redirecting to dashboard
  if (success) return (
    <div className="auth-bg"><div className="auth-card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏭</div>
      <h2 className="auth-title" style={{ textAlign: "center" }}>Warehouse is ready!</h2>
      <p style={{ color: "var(--gray-500)", marginTop: "0.5rem" }}>Entering dashboard...</p>
      <div style={{ marginTop: "1.5rem" }}><div className="spinner spinner-dark" style={{ margin: "0 auto" }} /></div>
    </div></div>
  );

  return (
    <div className="auth-bg"><div className="auth-card">
      <div className="auth-logo">
        <div className="auth-logo-icon">🏭</div>
        <span className="auth-logo-text">WarehouseOS</span>
      </div>
      <h2 className="auth-title">Admin Setup</h2>
      <p className="auth-subtitle">One-time setup to create the admin account.</p>

      {apiError && <div className="alert alert-error"><span>⚠️</span> {apiError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="field-label">Full Name</label>
          <input className={`input${errors.name && touchedFields.name ? " input-error" : name.trim().length >= 2 && touchedFields.name ? " input-success" : ""}`}
            placeholder="Admin Name"
            {...register("name", { required: "Required", minLength: { value: 2, message: "Min 2 chars" } })} />
          {errors.name && touchedFields.name && <p className="field-error">⚠ {errors.name.message}</p>}
        </div>

        <div className="field">
          <label className="field-label">Email</label>
          <input className={`input${errors.email && touchedFields.email ? " input-error" : EMAIL_RE.test(email) && touchedFields.email ? " input-success" : ""}`}
            type="email" placeholder="admin@company.com"
            {...register("email", { required: "Required", pattern: { value: EMAIL_RE, message: "Invalid email" } })} />
          {errors.email && touchedFields.email && <p className="field-error">⚠ {errors.email.message}</p>}
        </div>

        <div className="field">
          <label className="field-label">
            Password
            <span style={{ color: "var(--gray-400)", fontWeight: 400, fontSize: "0.75rem" }}>{getStrength(password)}/6 rules</span>
          </label>
          <div className="input-wrap">
            <input className={`input${password && !allRulesMet ? " input-error" : allRulesMet ? " input-success" : ""}`}
              type={showPw ? "text" : "password"} placeholder="Strong password" style={{ paddingRight: "2.5rem" }}
              {...register("password", { required: "Required", validate: () => allRulesMet || "Doesn't meet requirements" })} />
            <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)} tabIndex={-1}>{showPw ? "🙈" : "👁️"}</button>
          </div>
          {/* Live checklist — ticks off as user types */}
          <PasswordStrength password={password} />
        </div>

        <div className="field">
          <label className="field-label">Confirm Password</label>
          <div className="input-wrap">
            <input className={`input${confirmPassword && !passwordsMatch ? " input-error" : passwordsMatch ? " input-success" : ""}`}
              type={showPw ? "text" : "password"} placeholder="Repeat password" style={{ paddingRight: "2.5rem" }}
              {...register("confirmPassword", { required: "Required", validate: v => v === password || "Passwords don't match" })} />
          </div>
          {confirmPassword && !passwordsMatch && <p className="field-error">⚠ Passwords do not match</p>}
          {passwordsMatch && <p className="field-success">✓ Passwords match</p>}
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={!formReady || loading} style={{ marginTop: "0.5rem" }}>
          {loading ? <><span className="spinner" /> Setting up warehouse...</> : "Create Admin Account →"}
        </button>
      </form>

      <div className="divider">or</div>
      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--gray-500)" }}>
        Already set up? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
      </p>
    </div></div>
  );
}
