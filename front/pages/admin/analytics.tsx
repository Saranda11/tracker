import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { expenseApi, userApi, ExpenseStats } from "../../lib/api";
import { toast } from "react-toastify";
import {
  ChartBarIcon,
  DocumentTextIcon,
  FlagIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const AdminAnalyticsPage: React.FC = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

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
      const [expenseStatsResponse, userStatsResponse, monthlyTrendsResponse, categoryBreakdownResponse, departmentPerformanceResponse] = await Promise.all([
        expenseApi.getExpenseStats(),
        userApi.getUserStats(),
        expenseApi.getMonthlyTrends(),
        expenseApi.getCategoryBreakdown(),
        expenseApi.getDepartmentPerformance(),
      ]);

      setStats(expenseStatsResponse.data || expenseStatsResponse);
      setUserStats(userStatsResponse.data || userStatsResponse);
      setMonthlyData(monthlyTrendsResponse.data || monthlyTrendsResponse);
      setCategoryData(categoryBreakdownResponse.data || categoryBreakdownResponse);
      setDepartmentData(departmentPerformanceResponse.data || departmentPerformanceResponse);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoadingData(false);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">System overview and key metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalExpenses || 0}</p>
                <p className="text-sm text-gray-500">${stats?.totalAmount.toFixed(2) || "0.00"}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingExpenses || 0}</p>
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
                <h3 className="text-sm font-medium text-gray-500">Fraud Alerts</h3>
                <p className="text-2xl font-bold text-gray-900">{stats?.flaggedExpenses || 0}</p>
                <p className="text-sm text-red-600">{stats?.fraudStats?.fraudRate || "0%"} detection rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                <p className="text-2xl font-bold text-gray-900">{userStats?.activeUsers || 0}</p>
                <p className="text-sm text-gray-500">{userStats?.totalUsers || 0} total users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Expense Status Breakdown</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Approved</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats?.approvedExpenses || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Pending</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats?.pendingExpenses || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Rejected</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats?.rejectedExpenses || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Flagged</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stats?.flaggedExpenses || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">User Statistics</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Users</span>
                  <span className="text-sm font-semibold text-gray-900">{userStats?.totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Active Users</span>
                  <span className="text-sm font-semibold text-gray-900">{userStats?.activeUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Administrators</span>
                  <span className="text-sm font-semibold text-gray-900">{userStats?.administrators || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Employees</span>
                  <span className="text-sm font-semibold text-gray-900">{userStats?.employees || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Volume Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Expense Volume</h3>
                <div className="space-y-3">
                  {monthlyData && monthlyData.map((data, index) => {
                    const maxExpenses = Math.max(...monthlyData.map(d => d.expenses));
                    return (
                      <div key={data.month} className="flex items-center">
                        <div className="w-12 text-sm text-gray-600">{data.month}</div>
                        <div className="flex-1 ml-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{data.expenses} expenses</span>
                            <span className="text-sm text-gray-500">${data.amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${maxExpenses > 0 ? (data.expenses / maxExpenses) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval Rate Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Approval Rates</h3>
                <div className="space-y-3">
                  {monthlyData && monthlyData.map((data, index) => (
                    <div key={data.month} className="flex items-center">
                      <div className="w-12 text-sm text-gray-600">{data.month}</div>
                      <div className="flex-1 ml-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {data.expenses > 0 ? Math.round((data.approved / data.expenses) * 100) : 0}% approved
                          </span>
                          <span className="text-sm text-gray-500">
                            {data.approved}/{data.expenses}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${data.expenses > 0 ? (data.approved / data.expenses) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category & Department Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {categoryData && categoryData.slice(0, 5).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.category}</div>
                        <div className="text-sm text-gray-500">{category.count} expenses</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${category.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Department Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {departmentData && departmentData.slice(0, 5).map((dept, index) => (
                  <div key={dept.department} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                        <div className="text-sm text-gray-500">{dept.count} expenses</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${dept.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg: ${dept.avgExpense}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Fraud Detection Summary */}
        {stats?.fraudStats && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Fraud Detection Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{stats.fraudStats.flaggedExpenses}</div>
                  <div className="text-sm text-gray-600">Flagged Expenses</div>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs text-red-500">+12% from last month</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.fraudStats.pendingReview}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">-8% from last month</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.fraudStats.fraudRate}</div>
                  <div className="text-sm text-gray-600">Detection Rate</div>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+5% accuracy</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round((stats.fraudStats.flaggedExpenses / stats.totalExpenses) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-xs text-yellow-500">Medium risk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
