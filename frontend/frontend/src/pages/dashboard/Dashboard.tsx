// Main dashboard — single page with a sidebar and tab-based content.
// Admin sees global stats + Employees tab. Employee sees only their own data.
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/context/AuthContext";
import { getInventoryStats, getMyItems, getAllItems } from "../../core/api/inventory";
import { getBillStats, getMyBills, getAllBills } from "../../core/api/bills";
import { getEmployees } from "../../core/api/employees";
import type { InventoryItem } from "../../core/api/inventory";
import type { Bill } from "../../core/api/bills";
import type { User } from "../../core/api/auth";
import Loader from "../../components/common/Loader";
import InventoryPanel from "../../components/common/InventoryPanel";
import BillsPanel from "../../components/common/BillsPanel";
import EmployeesPanel from "../../components/admin/EmployeesPanel";

// The four tabs in the sidebar — Employees is admin-only
type Tab = "overview" | "inventory" | "bills" | "employees";

const NAV: { id: Tab; label: string; emoji: string; adminOnly?: boolean }[] = [
  { id: "overview",  label: "Overview",  emoji: "📊" },
  { id: "inventory", label: "Inventory", emoji: "📦" },
  { id: "bills",     label: "Bills",     emoji: "🧾" },
  { id: "employees", label: "Employees", emoji: "👥", adminOnly: true },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const isAdmin          = user?.role === "ADMIN";

  const [tab, setTab]       = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Shared data state — loaded once on mount
  const [items, setItems]         = useState<InventoryItem[]>([]);
  const [bills, setBills]         = useState<Bill[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // Admin-only aggregate stats for the overview cards
  const [invStats, setInvStats]   = useState({ total_items: 0, total_value: 0, low_stock: 0 });
  const [billStats, setBillStats] = useState({ total_bills: 0, total_revenue: 0, pending_bills: 0 });

  // First two letters of the user's name for the avatar circle
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admin loads everything in parallel for efficiency
        const [is, bs, itemsData, billsData, emps] = await Promise.all([
          getInventoryStats(), getBillStats(), getAllItems(), getAllBills(), getEmployees()
        ]);
        setInvStats(is); setBillStats(bs);
        setItems(itemsData.items); setBills(billsData.bills); setEmployees(emps);
      } else {
        // Employee only loads their own data
        const [itemsData, billsData] = await Promise.all([getMyItems(), getMyBills()]);
        setItems(itemsData.items); setBills(billsData.bills);
      }
    } catch { /* errors handled per-panel */ }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loader />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>

      {/* ── Sidebar navigation ── */}
      <aside style={{ width: "220px", background: "#fff", borderRight: "1px solid var(--gray-200)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🏭</div>
          <span style={{ fontWeight: 800, fontSize: "1rem", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WarehouseOS</span>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.filter(n => !n.adminOnly || isAdmin).map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", textAlign: "left",
                background: tab === n.id ? "var(--primary-light)" : "transparent",
                color: tab === n.id ? "var(--primary-dark)" : "var(--gray-600)" }}>
              <span>{n.emoji}</span>{n.label}
            </button>
          ))}
        </nav>

        {/* User info + logout at the bottom of the sidebar */}
        <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--gray-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "—"}</p>
              <p style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{user?.role}</p>
            </div>
          </div>
          <button className="btn btn-outline btn-full" style={{ fontSize: "0.8rem", padding: "0.4rem" }}
            onClick={() => { logout(); navigate("/login"); }}>Sign out</button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="animate-fadeIn">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>Hey, {user?.name?.split(" ")[0]} 👋</h1>
            <p style={{ color: "var(--gray-500)", marginBottom: "2rem", fontSize: "0.9rem" }}>Here's what's happening in the warehouse today.</p>

            {/* Admin sees 6 global stats; employee sees 4 personal stats */}
            <div className="stats-row">
              {(isAdmin ? [
                { label: "Total Items",     value: invStats.total_items,                          dot: "#6366f1" },
                { label: "Inventory Value", value: `₹${invStats.total_value.toLocaleString()}`,   dot: "#10b981" },
                { label: "Low Stock",       value: invStats.low_stock,                            dot: "#ef4444" },
                { label: "Total Bills",     value: billStats.total_bills,                         dot: "#f59e0b" },
                { label: "Revenue",         value: `₹${billStats.total_revenue.toLocaleString()}`, dot: "#059669" },
                { label: "Pending Bills",   value: billStats.pending_bills,                       dot: "#d97706" },
              ] : [
                { label: "My Items",  value: items.length,                                              dot: "#6366f1" },
                { label: "My Bills",  value: bills.length,                                              dot: "#f59e0b" },
                { label: "Confirmed", value: bills.filter(b => b.status === "CONFIRMED").length,        dot: "#10b981" },
                { label: "Draft",     value: bills.filter(b => b.status === "DRAFT").length,            dot: "#d97706" },
              ]).map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-value" style={{ fontSize: "1.4rem" }}>{s.value}</div>
                  <div className="stat-label"><span className="stat-dot" style={{ background: s.dot }} />{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick-glance recent activity */}
            <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--gray-100)" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>📦 Recent Inventory</h3>
                {items.slice(0, 5).map(i => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 500 }}>{i.name}</span>
                    <span style={{ color: i.quantity <= 5 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>{i.quantity} {i.unit}</span>
                  </div>
                ))}
                {items.length === 0 && <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>No items yet</p>}
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--gray-100)" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>🧾 Recent Bills</h3>
                {bills.slice(0, 5).map(b => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--gray-100)", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 500 }}>{b.bill_number}</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(b.total).toLocaleString()}</span>
                  </div>
                ))}
                {bills.length === 0 && <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>No bills yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Inventory tab — delegates to shared InventoryPanel component */}
        {tab === "inventory" && (
          <InventoryPanel items={items} isAdmin={isAdmin} onItemsChange={setItems} />
        )}

        {/* Bills tab — delegates to shared BillsPanel component */}
        {tab === "bills" && (
          <BillsPanel bills={bills} items={items} isAdmin={isAdmin} onBillsChange={setBills} />
        )}

        {/* Employees tab — admin only, delegates to EmployeesPanel */}
        {tab === "employees" && isAdmin && (
          <EmployeesPanel employees={employees} onEmployeesChange={setEmployees} />
        )}
      </main>
    </div>
  );
}
