// Employee registration page — accessed via invite link (?token=xxx)
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { registerEmployee } from "../../core/api/auth";
import PasswordStrength, { PASSWORD_RULES, getStrength } from "../../components/common/PasswordStrength";

interface FormData { name: string; password: string; confirmPassword: string; }

export default function EmployeeRegister() {
  // The invite token comes from the URL: /register/employee?token=xxx
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const { register, handleSubmit, control, formState: { errors, touchedFields } } = useForm<FormData>({ mode: "onChange" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  const password        = useWatch({ control, name: "password",        defaultValue: "" });
  const confirmPassword = useWatch({ control, name: "confirmPassword", defaultValue: "" });
  const name            = useWatch({ control, name: "name",            defaultValue: "" });

  const allRulesMet    = PASSWORD_RULES.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const formReady      = name.trim().length >= 2 && allRulesMet && passwordsMatch && !!token;

  const onSubmit = async (data: FormData) => {
    setApiError(""); setLoading(true);
    try {
      await registerEmployee(data.name, data.password, token);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: any) {
      const d = err.response?.data;
      setApiError(d?.errors?.length ? d.errors.map((e: any) => e.message).join(" · ") : d?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  // Guard: if no token in URL, show a helpful error instead of a broken form
  if (!token) return (
    <div className="auth-bg"><div className="auth-card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔗</div>
      <h2 className="auth-title" style={{ textAlign: "center" }}>Invalid Invite Link</h2>
      <p style={{ color: "var(--gray-500)", marginTop: "0.5rem" }}>Ask your admin to resend the invite.</p>
      <Link to="/login" className="btn btn-primary" style={{ marginTop: "1.5rem", display: "inline-flex" }}>Go to Login</Link>
    </div></div>
  );

  if (success) return (
    <div className="auth-bg"><div className="auth-card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
      <h2 className="auth-title" style={{ textAlign: "center" }}>Welcome aboard!</h2>
      <p style={{ color: "var(--gray-500)", marginTop: "0.5rem" }}>Account created. Redirecting to login...</p>
      <div style={{ marginTop: "1.5rem" }}><div className="spinner spinner-dark" style={{ margin: "0 auto" }} /></div>
    </div></div>
  );

  return (
    <div className="auth-bg"><div className="auth-card">
      <div className="auth-logo">
        <div className="auth-logo-icon">🏭</div>
        <span className="auth-logo-text">WarehouseOS</span>
      </div>
      <h2 className="auth-title">Complete your registration</h2>
      <p className="auth-subtitle">You've been invited to join the warehouse team.</p>

      {apiError && <div className="alert alert-error"><span>⚠️</span> {apiError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label className="field-label">Your Full Name</label>
          <input className={`input${errors.name && touchedFields.name ? " input-error" : name.trim().length >= 2 && touchedFields.name ? " input-success" : ""}`}
            placeholder="John Doe" autoComplete="name"
            {...register("name", { required: "Required", minLength: { value: 2, message: "Min 2 chars" } })} />
          {errors.name && touchedFields.name && <p className="field-error">⚠ {errors.name.message}</p>}
        </div>

        <div className="field">
          <label className="field-label">
            Password
            <span style={{ color: "var(--gray-400)", fontWeight: 400, fontSize: "0.75rem" }}>{getStrength(password)}/6 rules</span>
          </label>
          <div className="input-wrap">
            <input className={`input${password && !allRulesMet ? " input-error" : allRulesMet ? " input-success" : ""}`}
              type={showPw ? "text" : "password"} placeholder="Create a strong password" style={{ paddingRight: "2.5rem" }}
              {...register("password", { required: "Required", validate: () => allRulesMet || "Doesn't meet requirements" })} />
            <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)} tabIndex={-1}>{showPw ? "🙈" : "👁️"}</button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <div className="field">
          <label className="field-label">Confirm Password</label>
          <div className="input-wrap">
            <input className={`input${confirmPassword && !passwordsMatch ? " input-error" : passwordsMatch ? " input-success" : ""}`}
              type={showPw ? "text" : "password"} placeholder="Repeat password"
              {...register("confirmPassword", { required: "Required", validate: v => v === password || "Passwords don't match" })} />
          </div>
          {confirmPassword && !passwordsMatch && <p className="field-error">⚠ Passwords do not match</p>}
          {passwordsMatch && <p className="field-success">✓ Passwords match</p>}
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={!formReady || loading} style={{ marginTop: "0.5rem" }}>
          {loading ? <><span className="spinner" /> Creating your account...</> : "Join the Team →"}
        </button>
      </form>
    </div></div>
  );
}
