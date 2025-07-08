import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { expenseApi } from "../../lib/api";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { DocumentTextIcon, CurrencyDollarIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface ExpenseFormData {
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string;
}

const NewExpensePage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

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

  const categories = Object.keys(categoryMap);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setIsLoading(true);
      // Convert frontend category to backend format
      const backendCategory = categoryMap[data.category as keyof typeof categoryMap] || data.category;

      await expenseApi.createExpense({
        amount: Number(data.amount),
        category: backendCategory,
        description: data.description,
        date: data.date,
        receiptUrl: data.receiptUrl || undefined,
      });

      toast.success("Expense created successfully!");
      router.push("/expenses");
    } catch (error: any) {
      console.error("Error creating expense:", error);
      toast.error(error.response?.data?.error || "Failed to create expense");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Expense</h1>
          <p className="mt-1 text-sm text-gray-600">Submit a new expense for approval</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    {...register("amount", {
                      required: "Amount is required",
                      min: { value: 0.01, message: "Amount must be greater than 0" },
                    })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  {...register("category", { required: "Category is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <div className="relative">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <textarea
                  {...register("description", {
                    required: "Description is required",
                    minLength: { value: 10, message: "Description must be at least 10 characters" },
                  })}
                  rows={3}
                  placeholder="Describe your expense..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  {...register("date", { required: "Date is required" })}
                  type="date"
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL (Optional)</label>
              <input
                {...register("receiptUrl")}
                type="url"
                placeholder="https://example.com/receipt.pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/expenses")}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewExpensePage;
