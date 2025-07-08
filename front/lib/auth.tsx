import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { authApi, User } from "./api";
import { toast } from "react-toastify";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get("token");
        const userData = Cookies.get("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Verify token is still valid
          try {
            const profile = await authApi.getProfile();
            setUser(profile.user);
          } catch (error) {
            // Token is invalid, clear everything
            Cookies.remove("token");
            Cookies.remove("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        Cookies.remove("token");
        Cookies.remove("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ username, password });

      if (response.token && response.user) {
        // Store token and user data
        Cookies.set("token", response.token, { expires: 1 }); // 1 day
        Cookies.set("user", JSON.stringify(response.user), { expires: 1 });

        setUser(response.user);

        toast.success("Login successful!");

        // Redirect based on role
        if (response.user.role === "administrator") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);

      if (response.token && response.user) {
        // Store token and user data
        Cookies.set("token", response.token, { expires: 1 });
        Cookies.set("user", JSON.stringify(response.user), { expires: 1 });

        setUser(response.user);

        toast.success("Registration successful!");

        // Redirect based on role
        if (response.user.role === "administrator") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.error || "Registration failed";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API call success
      Cookies.remove("token");
      Cookies.remove("user");
      setUser(null);

      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 1 });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "administrator",
    isEmployee: user?.role === "employee",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>, allowedRoles?: string[]) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push("/login");
          return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          toast.error("You do not have permission to access this page");
          router.push("/dashboard");
          return;
        }
      }
    }, [user, loading, isAuthenticated, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user, isAdmin, isEmployee } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user) return false;

    switch (permission) {
      case "admin":
        return isAdmin;
      case "employee":
        return isEmployee;
      case "manage_users":
        return isAdmin;
      case "approve_expenses":
        return isAdmin;
      case "view_all_expenses":
        return isAdmin;
      case "create_expense":
        return isEmployee || isAdmin;
      case "edit_own_expense":
        return isEmployee || isAdmin;
      default:
        return false;
    }
  };

  return {
    hasPermission,
    canManageUsers: hasPermission("manage_users"),
    canApproveExpenses: hasPermission("approve_expenses"),
    canViewAllExpenses: hasPermission("view_all_expenses"),
    canCreateExpense: hasPermission("create_expense"),
    canEditOwnExpense: hasPermission("edit_own_expense"),
  };
};
