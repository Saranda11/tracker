import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";

const HomePage: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        // Redirect to appropriate dashboard based on role
        if (user?.role === "administrator") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default HomePage;
