import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const DEFAULT_PROD_API = "https://fullstack-intern-task-te6m.onrender.com/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isLocalhost ? "http://localhost:5000/api" : DEFAULT_PROD_API);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear invalid data
      if (localStorage.getItem("token")) {
        console.warn("Session expired or unauthorized. Clearing stored auth state.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const templatesApi = {
  getAll: (params) => api.get("/templates", { params }),
  getById: (id) => api.get(`/templates/${id}`),
};

export const favoritesApi = {
  getAll: () => api.get("/favorites"),
  add: (templateId) => api.post(`/favorites/${templateId}`),
  remove: (templateId) => api.delete(`/favorites/${templateId}`),
};

export default api;
