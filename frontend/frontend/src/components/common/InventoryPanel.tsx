// Inventory panel — shared by both admin and employee dashboards.
// Admin sees all items + "Added By" column. Employee sees only their own.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createItem, updateItem, deleteItem } from "../../core/api/inventory";
import type { InventoryItem, ItemCategory } from "../../core/api/inventory";

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  RAW_MATERIAL: "Raw Material", FINISHED_GOOD: "Finished Good",
  CONSUMABLE: "Consumable",     EQUIPMENT: "Equipment", OTHER: "Other",
};

interface Props {
  items: InventoryItem[];
  isAdmin: boolean;
  onItemsChange: (items: InventoryItem[]) => void;
}

export default function InventoryPanel({ items, isAdmin, onItemsChange }: Props) {
  const [search, setSearch]                   = useState("");
  const [showForm, setShowForm]               = useState(false);
  const [editingItem, setEditingItem]         = useState<InventoryItem | null>(null);
  const [formError, setFormError]             = useState("");
  const [saving, setSaving]                   = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState<InventoryItem | null>(null);

  const form = useForm<Partial<InventoryItem> & { name: string }>({
    mode: "onChange",
    defaultValues: { category: "OTHER", unit: "pcs", quantity: 0, price: 0 },
  });
  const titleVal = useWatch({ control: form.control, name: "name", defaultValue: "" });

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingItem(null);
    form.reset({ category: "OTHER", unit: "pcs", quantity: 0, price: 0 });
    setFormError(""); setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset(item);
    setFormError(""); setShowForm(true);
  };

  const handleSave = async (data: any) => {
    setFormError(""); setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateItem(editingItem.id, data);
        onItemsChange(items.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await createItem(data);
        onItemsChange([created, ...items]);
      }
      setShowForm(false); form.reset();
    } catch (err: any) {
      const d = err.response?.data;
      setFormError(d?.errors?.length ? d.errors.map((e: any) => e.message).join(" · ") : d?.message || "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteItem(deleteConfirm.id);
      onItemsChange(items.filter(i => i.id !== deleteConfirm.id));
    } catch { /* ignore */ }
    finally { setDeleteConfirm(null); }
  };

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>📦 Inventory</h2>
          <p style={{ color: "var(--gray-500)", fontSize: "0.85rem" }}>
            {isAdmin ? "All items across all employees" : "Items you've added"}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Item</button>
      </div>

      <input className="input" placeholder="🔍 Search by name or SKU..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: "1.25rem", maxWidth: 360 }} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p className="empty-state-title">No items found</p>
          <p className="empty-state-sub">Add your first inventory item.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <thead>
              <tr style={{ background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                {["Name", "SKU", "Category", "Qty", "Unit", "Price", ...(isAdmin ? ["Added By"] : []), "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--gray-100)", background: i % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, fontSize: "0.875rem" }}>{item.name}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--gray-500)" }}>{item.sku || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>{CATEGORY_LABELS[item.category]}</span>
                  </td>
                  {/* Highlight low stock in red */}
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: item.quantity <= 5 ? "var(--danger)" : "var(--gray-800)" }}>{item.quantity}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>{item.unit}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>₹{Number(item.price).toLocaleString()}</td>
                  {isAdmin && <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--gray-500)" }}>{item.added_by_user?.name || item.added_by_user?.email || "—"}</td>}
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? "✏️ Edit Item" : "📦 Add Inventory Item"}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={form.handleSubmit(handleSave)}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="field" style={{ gridColumn: "1/-1" }}>
                  <label className="field-label">Name *</label>
                  <input className={`input${form.formState.errors.name ? " input-error" : titleVal.trim() ? " input-success" : ""}`}
                    placeholder="Item name" {...form.register("name", { required: "Required" })} />
                  {form.formState.errors.name && <p className="field-error">⚠ {form.formState.errors.name.message}</p>}
                </div>
                <div className="field"><label className="field-label">SKU</label>
                  <input className="input" placeholder="e.g. WH-001" {...form.register("sku")} /></div>
                <div className="field"><label className="field-label">Category</label>
                  <select className="input" {...form.register("category")}>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div className="field"><label className="field-label">Quantity</label>
                  <input className="input" type="number" min={0} {...form.register("quantity", { valueAsNumber: true })} /></div>
                <div className="field"><label className="field-label">Unit</label>
                  <input className="input" placeholder="pcs / kg / L" {...form.register("unit")} /></div>
                <div className="field" style={{ gridColumn: "1/-1" }}><label className="field-label">Price (₹)</label>
                  <input className="input" type="number" min={0} step="0.01" {...form.register("price", { valueAsNumber: true })} /></div>
                <div className="field" style={{ gridColumn: "1/-1" }}><label className="field-label">Description</label>
                  <textarea className="input" style={{ height: 70, resize: "vertical" }} placeholder="Optional" {...form.register("description")} /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button className="btn btn-primary" type="submit" disabled={!titleVal.trim() || saving} style={{ flex: 1 }}>
                  {saving ? <><span className="spinner" /> Saving...</> : editingItem ? "Save Changes" : "Add Item"}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="overlay">
          <div className="modal confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <p className="confirm-title">Delete this item?</p>
            <p className="confirm-msg"><strong>{deleteConfirm.name}</strong> will be permanently removed.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={handleDelete}>Yes, delete</button>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Keep it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
