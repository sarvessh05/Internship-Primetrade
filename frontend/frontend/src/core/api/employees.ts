// Employee management API calls — admin only
import api from "./client";
import type { User } from "./auth";

// List all employees in the system
export const getEmployees = () =>
  api.get("/employees").then(r => r.data.data as User[]);

// Block an employee from logging in (data is preserved)
export const deactivateEmployee = (id: string) =>
  api.patch(`/employees/${id}/deactivate`).then(r => r.data.data as User);

// Restore login access for a previously deactivated employee
export const activateEmployee = (id: string) =>
  api.patch(`/employees/${id}/activate`).then(r => r.data.data as User);
