// Inventory API calls — used by both employee and admin views
import api from "./client";

export type ItemCategory = "RAW_MATERIAL" | "FINISHED_GOOD" | "CONSUMABLE" | "EQUIPMENT" | "OTHER";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: ItemCategory;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  added_by: string;
  created_at: string;
  updated_at: string;
  added_by_user?: { id: string; name: string | null; email: string }; // only in admin view
}

export interface Pagination { total: number; page: number; limit: number; total_pages: number; has_next: boolean; }
export interface ItemsResponse { items: InventoryItem[]; pagination: Pagination; }
export interface InventoryStats { total_items: number; total_value: number; low_stock: number; }

// Employee: fetch only their own items
export const getMyItems = (page = 1, search?: string) =>
  api.get("/inventory", { params: { page, limit: 20, search } }).then(r => r.data.data as ItemsResponse);

// Admin: fetch all items from all employees
export const getAllItems = (page = 1, search?: string) =>
  api.get("/inventory/admin/all", { params: { page, limit: 20, search } }).then(r => r.data.data as ItemsResponse);

// Admin: aggregate stats for the overview dashboard
export const getInventoryStats = () =>
  api.get("/inventory/admin/stats").then(r => r.data.data as InventoryStats);

// Create, update, delete — available to both roles (ownership enforced on backend)
export const createItem = (data: Partial<InventoryItem>) =>
  api.post("/inventory", data).then(r => r.data.data as InventoryItem);

export const updateItem = (id: string, data: Partial<InventoryItem>) =>
  api.patch(`/inventory/${id}`, data).then(r => r.data.data as InventoryItem);

export const deleteItem = (id: string) =>
  api.delete(`/inventory/${id}`);
