import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import { expenseApi, userApi, Expense, ExpenseStats } from "../../lib/api";
import { toast } from "react-toastify";
import {
  UsersIcon,
  DocumentTextIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [expensesResponse, statsResponse] = await Promise.all([
        expenseApi.getExpenses({ limit: 10, status: "pending" }),
        expenseApi.getExpenseStats(),
      ]);

      // Handle both response formats
      const expenseData = expensesResponse.expenses || expensesResponse.data || [];
      const statsData = statsResponse.data || statsResponse;

      setExpenses(expenseData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleQuickApprove = async (expenseId: string) => {
    try {
      await expenseApi.approveExpense(expenseId);
      toast.success("Expense approved successfully");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error approving expense:", error);
      toast.error("Failed to approve expense");
    }
  };

  const handleQuickReject = async (expenseId: string) => {
    try {
      await expenseApi.rejectExpense(expenseId);
      toast.success("Expense rejected successfully");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error rejecting expense:", error);
      toast.error("Failed to reject expense");
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Monitor and manage all expenses</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
                  <p className="text-sm text-gray-500">${stats.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-md">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingExpenses}</p>
                  <p className="text-sm text-yellow-600">Needs attention</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-md">
                  <FlagIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Flagged</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.flaggedExpenses}</p>
                  <p className="text-sm text-red-600">Fraud alerts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-md">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Fraud Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.fraudStats?.fraudRate || "0%"}</p>
                  <p className="text-sm text-gray-500">Detection rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/expenses"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Review Expenses
              </Link>
              <Link
                href="/admin/users"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                Manage Users
              </Link>
              <Link
                href="/admin/expenses?flagged=true"
                className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <FlagIcon className="h-5 w-5 mr-2" />
                Fraud Alerts
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Expenses</h2>
          </div>
          <div className="p-6">
            {expenses?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending expenses</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses?.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {expense.isFlagged ? (
                          <div className="p-2 bg-red-100 rounded-md">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-yellow-100 rounded-md">
                            <ClockIcon className="h-5 w-5 text-yellow-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{expense.description}</h3>
                        <p className="text-sm text-gray-500">
                          {expense.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} •{" "}
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          By:{" "}
                          {typeof expense.userId === "object"
                            ? `${expense.userId.firstName} ${expense.userId.lastName}`
                            : expense.userId}
                        </p>
                        {expense.isFlagged && expense.flagReason && (
                          <p className="text-sm text-red-600 mt-1">🚨 {expense.flagReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuickApprove(expense._id)}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickReject(expense._id)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                        <Link
                          href={`/admin/expenses/${expense._id}`}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Link href="/admin/expenses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View all expenses →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
