// Bills API calls — used by both employee and admin views
import api from "./client";

export type BillStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface BillItem {
  id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;  // price snapshot at time of billing
  subtotal: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_name: string;
  customer_contact: string | null;
  notes: string | null;
  status: BillStatus;
  total: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  items: BillItem[];
  created_by_user?: { id: string; name: string | null; email: string }; // only in admin view
}

export interface Pagination { total: number; page: number; limit: number; total_pages: number; has_next: boolean; }
export interface BillsResponse { bills: Bill[]; pagination: Pagination; }
export interface BillStats { total_bills: number; total_revenue: number; pending_bills: number; }

// Employee: fetch only their own bills
export const getMyBills = (page = 1, search?: string) =>
  api.get("/bills", { params: { page, limit: 20, search } }).then(r => r.data.data as BillsResponse);

// Admin: fetch all bills from all employees
export const getAllBills = (page = 1, search?: string) =>
  api.get("/bills/admin/all", { params: { page, limit: 20, search } }).then(r => r.data.data as BillsResponse);

// Admin: aggregate stats for the overview dashboard
export const getBillStats = () =>
  api.get("/bills/admin/stats").then(r => r.data.data as BillStats);

// Create a bill — stock is deducted immediately on the backend
export const createBill = (data: { customer_name: string; customer_contact?: string; notes?: string; items: { inventory_item_id: string; quantity: number }[] }) =>
  api.post("/bills", data).then(r => r.data.data as Bill);

// Move a bill through its lifecycle: DRAFT → CONFIRMED or CANCELLED
export const updateBillStatus = (id: string, status: BillStatus) =>
  api.patch(`/bills/${id}/status`, { status }).then(r => r.data.data as Bill);
