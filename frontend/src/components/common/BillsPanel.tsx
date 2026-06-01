// Bills panel — shared by both admin and employee dashboards.
// Admin sees all bills + "Created By" info. Employee sees only their own.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createBill, updateBillStatus } from "../../core/api/bills";
import type { Bill, BillStatus } from "../../core/api/bills";
import type { InventoryItem } from "../../core/api/inventory";

const BILL_STATUS_META: Record<BillStatus, { color: string; bg: string; emoji: string }> = {
  DRAFT:     { color: "#d97706", bg: "#fef3c7", emoji: "📝" },
  CONFIRMED: { color: "#059669", bg: "#d1fae5", emoji: "✅" },
  CANCELLED: { color: "#6b7280", bg: "#f3f4f6", emoji: "🚫" },
};

interface Props {
  bills: Bill[];
  items: InventoryItem[];   // needed to populate the item selector in the create form
  isAdmin: boolean;
  onBillsChange: (bills: Bill[]) => void;
}

export default function BillsPanel({ bills, items, isAdmin, onBillsChange }: Props) {
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [billLines, setBillLines]   = useState([{ inventory_item_id: "", quantity: 1 }]);
  const [viewBill, setViewBill]     = useState<Bill | null>(null);

  const form = useForm<{ customer_name: string; customer_contact?: string; notes?: string }>({ mode: "onChange" });

  const filtered = bills.filter(b =>
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    b.bill_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: any) => {
    setFormError(""); setSaving(true);
    try {
      const bill = await createBill({ ...data, items: billLines.filter(l => l.inventory_item_id) });
      onBillsChange([bill, ...bills]);
      setShowForm(false); form.reset();
      setBillLines([{ inventory_item_id: "", quantity: 1 }]);
    } catch (err: any) {
      const d = err.response?.data;
      setFormError(d?.errors?.length ? d.errors.map((e: any) => e.message).join(" · ") : d?.message || "Failed");
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (bill: Bill, status: BillStatus) => {
    try {
      const updated = await updateBillStatus(bill.id, status);
      onBillsChange(bills.map(b => b.id === updated.id ? updated : b));
    } catch { /* ignore */ }
  };

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>🧾 Bills</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "0.85rem" }}>
            {isAdmin ? "All bills across all employees" : "Bills you've created"}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { form.reset(); setBillLines([{ inventory_item_id: "", quantity: 1 }]); setFormError(""); setShowForm(true); }}>+ New Bill</button>
      </div>

      <input className="input" placeholder="🔍 Search by customer or bill number..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: "1.25rem", maxWidth: 400 }} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <p className="empty-state-title">No bills yet</p>
          <p className="empty-state-sub">Create your first bill to dispatch inventory.</p>
        </div>
      ) : (
        <div className="task-grid">
          {filtered.map(bill => {
            const sm = BILL_STATUS_META[bill.status];
            return (
              <div className="task-card" key={bill.id} onClick={() => setViewBill(bill)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--gray-500)" }}>{bill.bill_number}</span>
                  <span className="badge" style={{ background: sm.bg, color: sm.color }}>{sm.emoji} {bill.status}</span>
                </div>
                <p className="task-title">{bill.customer_name}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary)" }}>₹{Number(bill.total).toLocaleString()}</p>
                <p className="task-meta">{bill.items.length} item{bill.items.length !== 1 ? "s" : ""} · {new Date(bill.created_at).toLocaleDateString()}</p>
                {isAdmin && bill.created_by_user && (
                  <p style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>by {bill.created_by_user.name || bill.created_by_user.email}</p>
                )}
                {/* Status action buttons — stop click from opening the detail modal */}
                {bill.status === "DRAFT" && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-outline btn-sm" style={{ color: "var(--success)", borderColor: "var(--success)" }} onClick={() => handleStatusChange(bill, "CONFIRMED")}>✅ Confirm</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(bill, "CANCELLED")}>🚫 Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create bill modal */}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 Create Bill</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={form.handleSubmit(handleSave)}>
              <div className="field">
                <label className="field-label">Customer Name *</label>
                <input className="input" placeholder="Customer / Company name" {...form.register("customer_name", { required: "Required" })} />
                {form.formState.errors.customer_name && <p className="field-error">⚠ Required</p>}
              </div>
              <div className="field">
                <label className="field-label">Contact <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input" placeholder="Phone or email" {...form.register("customer_contact")} />
              </div>
              <div className="field">
                <label className="field-label">Notes <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(optional)</span></label>
                <textarea className="input" style={{ height: 60, resize: "vertical" }} {...form.register("notes")} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="field-label" style={{ marginBottom: "0.5rem", display: "block" }}>Items *</label>
                {billLines.map((line, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                    <select className="input" style={{ flex: 2 }} value={line.inventory_item_id}
                      onChange={e => setBillLines(prev => prev.map((l, i) => i === idx ? { ...l, inventory_item_id: e.target.value } : l))}>
                      <option value="">Select item...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} (stock: {i.quantity})</option>)}
                    </select>
                    <input className="input" type="number" min={1} style={{ flex: 1 }} value={line.quantity}
                      onChange={e => setBillLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) } : l))} />
                    {billLines.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setBillLines(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setBillLines(prev => [...prev, { inventory_item_id: "", quantity: 1 }])}>+ Add Line</button>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                  {saving ? <><span className="spinner" /> Creating bill...</> : "Create Bill"}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill detail modal */}
      {viewBill && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setViewBill(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 {viewBill.bill_number}</h3>
              <button className="modal-close" onClick={() => setViewBill(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
              <div><span style={{ color: "var(--gray-500)" }}>Customer</span><p style={{ fontWeight: 600 }}>{viewBill.customer_name}</p></div>
              <div><span style={{ color: "var(--gray-500)" }}>Status</span>
                <p><span className="badge" style={{ background: BILL_STATUS_META[viewBill.status].bg, color: BILL_STATUS_META[viewBill.status].color }}>{BILL_STATUS_META[viewBill.status].emoji} {viewBill.status}</span></p>
              </div>
              {viewBill.customer_contact && <div><span style={{ color: "var(--gray-500)" }}>Contact</span><p style={{ fontWeight: 600 }}>{viewBill.customer_contact}</p></div>}
              <div><span style={{ color: "var(--gray-500)" }}>Date</span><p style={{ fontWeight: 600 }}>{new Date(viewBill.created_at).toLocaleDateString()}</p></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <thead><tr style={{ background: "var(--gray-50)" }}>
                {["Item", "Qty", "Unit Price", "Subtotal"].map(h => <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 700, color: "var(--gray-500)", fontSize: "0.75rem" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {viewBill.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{items.find(i => i.id === item.inventory_item_id)?.name || item.inventory_item_id}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>{item.quantity}</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>₹{Number(item.unit_price).toLocaleString()}</td>
                    <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>₹{Number(item.subtotal).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: "right", fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>Total: ₹{Number(viewBill.total).toLocaleString()}</div>
            {viewBill.notes && <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>📝 {viewBill.notes}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
