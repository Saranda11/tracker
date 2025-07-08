const Expense = require("../models/Expense");
const User = require("../models/User");
const FraudDetector = require("../utils/fraudDetection");
const { validationResult } = require("express-validator");

/**
 * Expense Controller
 * Handles expense operations with fraud detection
 */

/**
 * Create a new expense
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { amount, category, description, date, receiptUrl } = req.body;
    const userId = req.user.userId;

    // Create expense
    const expense = new Expense({
      userId,
      amount,
      category,
      description,
      date: date || new Date(),
      receiptUrl,
    });

    // Run fraud detection
    const fraudResult = await FraudDetector.detectFraud(expense);

    if (fraudResult.isFlagged) {
      expense.isFlagged = true;
      expense.flagReason = fraudResult.reason;
      expense.flaggedAt = new Date();
    }

    await expense.save();

    // Populate user info
    await expense.populate("userId", "username firstName lastName email");

    res.status(201).json({
      message: "Expense created successfully",
      expense,
      fraudCheck: {
        isFlagged: fraudResult.isFlagged,
        reason: fraudResult.reason,
      },
    });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({
      error: "Failed to create expense",
      details: error.message,
    });
  }
};

/**
 * Get expenses (with filtering and pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      isFlagged,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      userId,
    } = req.query;

    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    // Build query
    let query = {};

    // Non-admin users can only see their own expenses
    if (!isAdmin) {
      query.userId = currentUser.userId;
    } else if (userId) {
      query.userId = userId;
    }

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (isFlagged !== undefined) query.isFlagged = isFlagged === "true";

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .populate("userId", "username firstName lastName email department")
      .populate("reviewedBy", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);
    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      error: "Failed to get expenses",
      details: error.message,
    });
  }
};

/**
 * Get expense by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    const expense = await Expense.findById(id)
      .populate("userId", "username firstName lastName email department")
      .populate("reviewedBy", "username firstName lastName");

    if (!expense) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    // Check if user can access this expense
    if (!isAdmin && expense.userId._id.toString() !== currentUser.userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    res.json({
      expense,
    });
  } catch (error) {
    console.error("Get expense by ID error:", error);
    res.status(500).json({
      error: "Failed to get expense",
      details: error.message,
    });
  }
};

/**
 * Update expense (only by owner before approval)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { amount, category, description, date, receiptUrl } = req.body;
    const currentUser = req.user;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    // Check if user can update this expense
    if (expense.userId.toString() !== currentUser.userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    // Check if expense is already approved/rejected
    if (expense.status !== "pending") {
      return res.status(400).json({
        error: "Cannot update expense that has already been reviewed",
      });
    }

    // Update expense
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.description = description || expense.description;
    expense.date = date || expense.date;
    expense.receiptUrl = receiptUrl || expense.receiptUrl;

    // Re-run fraud detection if amount or date changed
    if (amount || date) {
      const fraudResult = await FraudDetector.detectFraud(expense);

      expense.isFlagged = fraudResult.isFlagged;
      expense.flagReason = fraudResult.reason;
      expense.flaggedAt = fraudResult.isFlagged ? new Date() : null;
    }

    await expense.save();

    // Populate user info
    await expense.populate("userId", "username firstName lastName email");

    res.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({
      error: "Failed to update expense",
      details: error.message,
    });
  }
};

/**
 * Delete expense (only by owner before approval)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    // Check if user can delete this expense
    if (expense.userId.toString() !== currentUser.userId) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    // Check if expense is already approved/rejected
    if (expense.status !== "pending") {
      return res.status(400).json({
        error: "Cannot delete expense that has already been reviewed",
      });
    }

    await Expense.findByIdAndDelete(id);

    res.json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({
      error: "Failed to delete expense",
      details: error.message,
    });
  }
};

/**
 * Approve expense (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const currentUser = req.user;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        error: "Expense has already been reviewed",
      });
    }

    await expense.approve(currentUser.userId, notes);

    // Populate user info
    await expense.populate("userId", "username firstName lastName email");
    await expense.populate("reviewedBy", "username firstName lastName");

    res.json({
      message: "Expense approved successfully",
      expense,
    });
  } catch (error) {
    console.error("Approve expense error:", error);
    res.status(500).json({
      error: "Failed to approve expense",
      details: error.message,
    });
  }
};

/**
 * Reject expense (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const currentUser = req.user;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        error: "Expense has already been reviewed",
      });
    }

    await expense.reject(currentUser.userId, notes);

    // Populate user info
    await expense.populate("userId", "username firstName lastName email");
    await expense.populate("reviewedBy", "username firstName lastName");

    res.json({
      message: "Expense rejected successfully",
      expense,
    });
  } catch (error) {
    console.error("Reject expense error:", error);
    res.status(500).json({
      error: "Failed to reject expense",
      details: error.message,
    });
  }
};

/**
 * Get expense statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExpenseStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    let query = {};
    if (!isAdmin) {
      query.userId = currentUser.userId;
    }

    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      flaggedExpenses,
      totalAmount,
      fraudStats,
    ] = await Promise.all([
      Expense.countDocuments(query),
      Expense.countDocuments({ ...query, status: "pending" }),
      Expense.countDocuments({ ...query, status: "approved" }),
      Expense.countDocuments({ ...query, status: "rejected" }),
      Expense.countDocuments({ ...query, isFlagged: true }),
      Expense.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      isAdmin ? FraudDetector.getFraudStatistics() : null,
    ]);

    res.json({
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      flaggedExpenses,
      totalAmount: totalAmount[0]?.total || 0,
      ...(fraudStats && { fraudStats }),
    });
  } catch (error) {
    console.error("Get expense stats error:", error);
    res.status(500).json({
      error: "Failed to get expense statistics",
      details: error.message,
    });
  }
};

/**
 * Get monthly trends for analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonthlyTrends = async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    // Get data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Expense.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          expenses: { $sum: 1 },
          amount: { $sum: "$amount" },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Format the data with month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedData = monthlyData.map(item => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      expenses: item.expenses,
      amount: item.amount,
      approved: item.approved,
      rejected: item.rejected
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Get monthly trends error:", error);
    res.status(500).json({
      error: "Failed to get monthly trends",
      details: error.message,
    });
  }
};

/**
 * Get category breakdown for analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCategoryBreakdown = async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const categoryData = await Expense.aggregate([
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    // Calculate total amount for percentage calculation
    const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);

    const formattedData = categoryData.map(item => ({
      category: item._id,
      amount: item.amount,
      count: item.count,
      percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Get category breakdown error:", error);
    res.status(500).json({
      error: "Failed to get category breakdown",
      details: error.message,
    });
  }
};

/**
 * Get department performance for analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDepartmentPerformance = async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = currentUser.role === "administrator";

    if (!isAdmin) {
      return res.status(403).json({
        error: "Access denied. Admin only.",
      });
    }

    const departmentData = await Expense.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $group: {
          _id: "$user.department",
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    const formattedData = departmentData.map(item => ({
      department: item._id || "Unknown",
      amount: item.amount,
      count: item.count,
      avgExpense: item.count > 0 ? Math.round(item.amount / item.count) : 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Get department performance error:", error);
    res.status(500).json({
      error: "Failed to get department performance",
      details: error.message,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStats,
  getMonthlyTrends,
  getCategoryBreakdown,
  getDepartmentPerformance,
};
