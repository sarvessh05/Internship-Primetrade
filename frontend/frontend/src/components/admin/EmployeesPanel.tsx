// Admin panel: invite employees and manage their access
import { useState } from "react";
import { inviteEmployee } from "../../core/api/auth";
import { deactivateEmployee, activateEmployee } from "../../core/api/employees";
import type { User } from "../../core/api/auth";

interface Props {
  employees: User[];
  onEmployeesChange: (updated: User[]) => void;
}

export default function EmployeesPanel({ employees, onEmployeesChange }: Props) {
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteResult, setInviteResult] = useState<{ token: string; email: string } | null>(null);
  const [inviteError, setInviteError]   = useState("");
  const [inviting, setInviting]         = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteError(""); setInviting(true);
    try {
      const result = await inviteEmployee(inviteEmail);
      setInviteResult(result);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Failed to send invite");
    } finally { setInviting(false); }
  };

  const handleToggle = async (emp: User) => {
    try {
      const updated = emp.is_active ? await deactivateEmployee(emp.id) : await activateEmployee(emp.id);
      onEmployeesChange(employees.map(e => e.id === updated.id ? updated : e));
    } catch { /* ignore — user sees no change */ }
  };

  return (
    <div className="animate-fadeIn">
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>👥 Employees</h2>
      <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Manage your warehouse team.</p>

      {/* Invite form */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--gray-200)", marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>📧 Invite New Employee</h3>

        {/* Show the invite link after a successful invite */}
        {inviteResult && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            ✅ Invite sent to <strong>{inviteResult.email}</strong><br />
            <span style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
              Share this link: {window.location.origin}/register/employee?token={inviteResult.token}
            </span>
          </div>
        )}
        {inviteError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>⚠️ {inviteError}</div>}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input className="input" type="email" placeholder="employee@company.com"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={handleInvite} disabled={!inviteEmail || inviting}>
            {inviting ? <><span className="spinner" /> Sending...</> : "Send Invite"}
          </button>
        </div>
      </div>

      {/* Employee table */}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid var(--gray-200)" }}>
        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p className="empty-state-title">No employees yet</p>
            <p className="empty-state-sub">Invite someone to get started.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
              {["Name", "Email", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom: "1px solid var(--gray-100)", background: i % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, fontSize: "0.875rem" }}>{emp.name || <em style={{ color: "var(--gray-400)" }}>Pending</em>}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{emp.email}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className="badge" style={{ background: emp.is_active ? "#d1fae5" : "#fee2e2", color: emp.is_active ? "#059669" : "#dc2626" }}>
                      {emp.is_active ? "✅ Active" : "🚫 Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button className={`btn btn-sm ${emp.is_active ? "btn-danger" : "btn-outline"}`} onClick={() => handleToggle(emp)}>
                      {emp.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
