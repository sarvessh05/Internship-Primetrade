// Axios instance shared by all API modules.
// Automatically attaches the JWT and redirects to /login on 401.
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // set in .env → VITE_API_URL=http://localhost:8000/api/v1
  headers: { "Content-Type": "application/json" },
});

// Attach the stored JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stored credentials and send user back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
