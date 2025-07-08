import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import { expenseApi, Expense } from "../../lib/api";
import { toast } from "react-toastify";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const AdminExpensesPage: React.FC = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(router.query.status || "all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterFlagged, setFilterFlagged] = useState(router.query.flagged === "true");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingExpenses, setProcessingExpenses] = useState<Set<string>>(new Set());

  // Map frontend display names to backend values
  const categoryMap = {
    Travel: "travel",
    Meals: "meals",
    "Office Supplies": "office_supplies",
    Software: "software",
    Training: "training",
    Marketing: "marketing",
    Equipment: "equipment",
    Entertainment: "entertainment",
    Accommodation: "accommodation",
    Other: "other",
  };

  const categories = Object.keys(categoryMap);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchExpenses();
    }
  }, [isAuthenticated, isAdmin, currentPage, filterStatus, filterCategory, filterFlagged]);

  const fetchExpenses = async () => {
    try {
      setLoadingData(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filterStatus !== "all") {
        params.status = filterStatus;
      }
      if (filterCategory !== "all") {
        params.category = categoryMap[filterCategory as keyof typeof categoryMap] || filterCategory;
      }
      if (filterFlagged) {
        params.isFlagged = true;
      }

      const response = await expenseApi.getExpenses(params);
      // Handle both response formats
      const expenseData = response.expenses || response.data || [];
      const paginationData = response.pagination || {};

      setExpenses(expenseData);
      setTotalPages(paginationData.pages || 1);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoadingData(false);
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    try {
      setProcessingExpenses((prev) => new Set(prev).add(expenseId));
      await expenseApi.approveExpense(expenseId);
      toast.success("Expense approved successfully");
      fetchExpenses();
    } catch (error: any) {
      console.error("Error approving expense:", error);
      toast.error("Failed to approve expense");
    } finally {
      setProcessingExpenses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    const reason = prompt("Enter reason for rejection (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessingExpenses((prev) => new Set(prev).add(expenseId));
      await expenseApi.rejectExpense(expenseId, reason);
      toast.success("Expense rejected successfully");
      fetchExpenses();
    } catch (error: any) {
      console.error("Error rejecting expense:", error);
      toast.error("Failed to reject expense");
    } finally {
      setProcessingExpenses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredExpenses =
    expenses?.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof expense.userId === "object" &&
          `${expense.userId.firstName} ${expense.userId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    }) || [];

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
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="mt-1 text-sm text-gray-600">Review and manage all employee expenses</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flagged</label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filterFlagged}
                    onChange={(e) => setFilterFlagged(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Only flagged</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          </div>
          <div className="p-6">
            {filteredExpenses?.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No expenses found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses?.map((expense) => (
                  <div
                    key={expense._id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      expense.isFlagged ? "border-red-300 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {expense.isFlagged ? (
                          <div className="p-2 bg-red-100 rounded-md">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-100 rounded-md">{getStatusIcon(expense.status)}</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
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
                        {expense.reviewNotes && (
                          <p className="text-sm text-gray-600 mt-1">Review: {expense.reviewNotes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/expenses/${expense._id}`}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        {expense.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApproveExpense(expense._id)}
                              disabled={processingExpenses.has(expense._id)}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              {processingExpenses.has(expense._id) ? "Processing..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectExpense(expense._id)}
                              disabled={processingExpenses.has(expense._id)}
                              className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              {processingExpenses.has(expense._id) ? "Processing..." : "Reject"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExpensesPage;
