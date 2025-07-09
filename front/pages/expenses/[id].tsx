import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { expenseApi, Expense } from "../../lib/api";
import { toast } from "react-toastify";
import { ArrowLeftIcon, PencilIcon, TrashIcon, FlagIcon } from "@heroicons/react/24/outline";

const ExpenseDetailsPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    receiptUrl: "",
  });

  const categories = ["Travel", "Meals", "Office Supplies", "Transportation", "Entertainment", "Accommodation", "Other"];

  // Map frontend display names to backend values
  const categoryMap = {
    Travel: "travel",
    Meals: "meals",
    "Office Supplies": "office_supplies",
    Transportation: "transportation",
    Entertainment: "entertainment",
    Accommodation: "accommodation",
    Other: "other",
  };

  // Reverse map for displaying backend values
  const reverseCategoryMap = Object.fromEntries(
    Object.entries(categoryMap).map(([key, value]) => [value, key])
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchExpense();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchExpense = async () => {
    try {
      setLoadingData(true);
      const response = await expenseApi.getExpenseById(id as string);
      setExpense(response.expense);
      setEditData({
        description: response.expense.description,
        amount: response.expense.amount.toString(),
        category: reverseCategoryMap[response.expense.category] || response.expense.category,
        date: response.expense.date.split("T")[0],
        receiptUrl: response.expense.receiptUrl || "",
      });
    } catch (error: any) {
      console.error("Error fetching expense:", error);
      toast.error("Failed to load expense");
      router.push("/expenses");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    try {
      // Convert frontend category to backend format
      const backendCategory = categoryMap[editData.category as keyof typeof categoryMap] || editData.category;
      
      await expenseApi.updateExpense(id as string, {
        description: editData.description,
        amount: Number(editData.amount),
        category: backendCategory,
        date: editData.date,
        receiptUrl: editData.receiptUrl || undefined,
      });
      toast.success("Expense updated successfully");
      setIsEditing(false);
      fetchExpense();
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await expenseApi.deleteExpense(id as string);
      toast.success("Expense deleted successfully");
      router.push("/expenses");
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
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
            onClick={() => router.push("/expenses")}
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
            onClick={() => router.push("/expenses")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Expenses
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Expense Details</h1>
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
              {expense.status === "pending" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                  <input
                    type="url"
                    value={editData.receiptUrl}
                    onChange={(e) => setEditData({ ...editData, receiptUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
                  <p className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
                  <p className="text-lg text-gray-900">
                    {reverseCategoryMap[expense.category] || expense.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Date</h3>
                  <p className="text-lg text-gray-900">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
                  <p className="text-lg text-gray-900">{new Date(expense.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-900">{expense.description}</p>
                </div>
                {expense.receiptUrl && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Receipt</h3>
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
                {expense.isFlagged && expense.flagReason && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-red-500 mb-2">Fraud Alert</h3>
                    <p className="text-red-600">{expense.flagReason}</p>
                  </div>
                )}
                {expense.reviewNotes && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Review Notes</h3>
                    <p className="text-gray-900">{expense.reviewNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailsPage;
