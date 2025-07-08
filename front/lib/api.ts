import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove("token");
      Cookies.remove("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "employee" | "administrator";
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  userId: string | User;
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | User;
  reviewedAt?: string;
  reviewNotes?: string;
  isFlagged: boolean;
  flagReason?: string;
  flaggedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  flaggedExpenses: number;
  totalAmount: number;
  fraudStats?: {
    totalExpenses: number;
    flaggedExpenses: number;
    pendingReview: number;
    fraudRate: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    role?: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put("/auth/profile", userData);
    return response.data;
  },

  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    const response = await api.put("/auth/change-password", passwords);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

// Expense API
export const expenseApi = {
  getExpenses: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    isFlagged?: boolean;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    userId?: string;
  }) => {
    const response = await api.get("/expenses", { params });
    return response.data;
  },

  getExpenseById: async (id: string) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (expenseData: {
    amount: number;
    category: string;
    description: string;
    date?: string;
    receiptUrl?: string;
  }) => {
    const response = await api.post("/expenses", expenseData);
    return response.data;
  },

  updateExpense: async (id: string, expenseData: Partial<Expense>) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  approveExpense: async (id: string, notes?: string) => {
    const response = await api.put(`/expenses/${id}/approve`, { notes });
    return response.data;
  },

  rejectExpense: async (id: string, notes?: string) => {
    const response = await api.put(`/expenses/${id}/reject`, { notes });
    return response.data;
  },

  getExpenseStats: async () => {
    const response = await api.get("/expenses/stats");
    return response.data;
  },

  getMonthlyTrends: async () => {
    const response = await api.get("/expenses/analytics/monthly-trends");
    return response.data;
  },

  getCategoryBreakdown: async () => {
    const response = await api.get("/expenses/analytics/category-breakdown");
    return response.data;
  },

  getDepartmentPerformance: async () => {
    const response = await api.get("/expenses/analytics/department-performance");
    return response.data;
  },
};

// User API (Admin only)
export const userApi = {
  getUsers: async (params?: { page?: number; limit?: number; role?: string; isActive?: boolean; search?: string }) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get("/users/stats");
    return response.data;
  },

  resetUserPassword: async (id: string, newPassword: string) => {
    const response = await api.put(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },
};

export default api;
