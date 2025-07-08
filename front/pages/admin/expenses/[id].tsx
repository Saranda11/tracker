import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../lib/auth";
import { expenseApi, Expense } from "../../../lib/api";
import { toast } from "react-toastify";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, FlagIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const AdminExpenseDetailsPage: React.FC = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (id && isAuthenticated && isAdmin) {
      fetchExpense();
    }
  }, [id, isAuthenticated, isAdmin]);

  const fetchExpense = async () => {
    try {
      setLoadingData(true);
      const response = await expenseApi.getExpenseById(id as string);
      setExpense(response.expense);
    } catch (error: any) {
      console.error("Error fetching expense:", error);
      toast.error("Failed to load expense");
      router.push("/admin/expenses");
    } finally {
      setLoadingData(false);
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await expenseApi.approveExpense(id as string, reviewNotes);
      toast.success("Expense approved successfully");
      router.push("/admin/expenses");
    } catch (error: any) {
      console.error("Error approving expense:", error);
      toast.error("Failed to approve expense");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      await expenseApi.rejectExpense(id as string, reviewNotes);
      toast.success("Expense rejected successfully");
      router.push("/admin/expenses");
    } catch (error: any) {
      console.error("Error rejecting expense:", error);
      toast.error("Failed to reject expense");
    } finally {
      setProcessing(false);
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Expense not found</h2>
          <button
            onClick={() => router.push("/admin/expenses")}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Expenses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/expenses")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Expenses
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Review Expense</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">{expense.description}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </span>
                {expense.isFlagged && (
                  <div className="flex items-center text-red-600">
                    <FlagIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Flagged</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {typeof expense.userId === "object"
                      ? `${expense.userId.firstName} ${expense.userId.lastName}`
                      : expense.userId}
                  </p>
                  <p className="text-xs text-gray-500">
                    {typeof expense.userId === "object" ? expense.userId.email : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
                <p className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
                <p className="text-lg text-gray-900">
                  {expense.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Date</h3>
                <p className="text-lg text-gray-900">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted</h3>
                <p className="text-lg text-gray-900">{new Date(expense.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900">{expense.description}</p>
            </div>

            {expense.receiptUrl && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Receipt</h3>
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  View Receipt
                </a>
              </div>
            )}

            {expense.isFlagged && expense.flagReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">🚨 Fraud Alert</h3>
                <p className="text-red-700">{expense.flagReason}</p>
                <p className="text-xs text-red-600 mt-1">
                  Flagged on {new Date(expense.flaggedAt || "").toLocaleDateString()}
                </p>
              </div>
            )}

            {expense.reviewNotes && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Previous Review Notes</h3>
                <p className="text-gray-700">{expense.reviewNotes}</p>
              </div>
            )}

            {expense.status === "pending" && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Review Decision</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about your decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {processing ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    {processing ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExpenseDetailsPage;
