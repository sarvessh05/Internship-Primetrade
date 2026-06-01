// Live password strength indicator — shows a bar and a checklist of rules.
// Used on both AdminRegister and EmployeeRegister pages.

interface Rule { label: string; test: (pw: string) => boolean; }

// The 6 rules that must all be met before the form can be submitted
export const PASSWORD_RULES: Rule[] = [
  { label: "8+ characters",     test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter",  test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter",  test: (pw) => /[a-z]/.test(pw) },
  { label: "Number",            test: (pw) => /\d/.test(pw) },
  { label: "Special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  { label: "No spaces",         test: (pw) => pw.length > 0 && !/\s/.test(pw) },
];

// Returns how many rules the current password satisfies (0–6)
export function getStrength(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}

const STRENGTH_CONFIG = [
  { label: "",          color: "var(--gray-200)" },
  { label: "Weak",      color: "#ef4444" },
  { label: "Weak",      color: "#f97316" },
  { label: "Fair",      color: "#f59e0b" },
  { label: "Good",      color: "#84cc16" },
  { label: "Strong",    color: "#10b981" },
  { label: "Fort Knox", color: "#059669" },
];

export default function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password);
  const config = STRENGTH_CONFIG[strength];
  if (!password) return null;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {/* Coloured bar — fills left to right as rules are met */}
      <div className="strength-bar-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="strength-bar-seg"
            style={{ background: i < strength ? config.color : "var(--gray-200)", transition: `background 0.3s ease ${i * 0.05}s` }} />
        ))}
      </div>
      {strength > 0 && <p className="strength-label" style={{ color: config.color }}>{config.label}</p>}

      {/* Checklist — each rule ticks off as the user types */}
      <div className="pw-rules">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <div key={rule.label} className={`pw-rule${met ? " met" : ""}`}>
              <span className="pw-rule-icon">{met ? "✓" : ""}</span>
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
