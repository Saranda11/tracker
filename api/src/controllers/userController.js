const User = require("../models/User");
const Expense = require("../models/Expense");
const { validationResult } = require("express-validator");

/**
 * User Controller
 * Handles user management operations (admin only)
 */

/**
 * Get all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;

    // Build query
    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      error: "Failed to get users",
      details: error.message,
    });
  }
};

/**
 * Get user by ID (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Get user's expense statistics
    const [totalExpenses, pendingExpenses, approvedExpenses, rejectedExpenses, flaggedExpenses, totalAmount] =
      await Promise.all([
        Expense.countDocuments({ userId: id }),
        Expense.countDocuments({ userId: id, status: "pending" }),
        Expense.countDocuments({ userId: id, status: "approved" }),
        Expense.countDocuments({ userId: id, status: "rejected" }),
        Expense.countDocuments({ userId: id, isFlagged: true }),
        Expense.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      ]);

    res.json({
      user,
      expenseStats: {
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        flaggedExpenses,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      error: "Failed to get user",
      details: error.message,
    });
  }
};

/**
 * Update user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
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
    const { firstName, lastName, email, department, role, isActive } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          error: "Email already in use",
          field: "email",
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(department && { department }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Failed to update user",
      details: error.message,
    });
  }
};

/**
 * Delete user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Prevent admin from deleting themselves
    if (id === currentUser.userId) {
      return res.status(400).json({
        error: "Cannot delete your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check if user has pending expenses
    const pendingExpenses = await Expense.countDocuments({
      userId: id,
      status: "pending",
    });

    if (pendingExpenses > 0) {
      return res.status(400).json({
        error: "Cannot delete user with pending expenses",
        pendingExpenses,
      });
    }

    // Instead of deleting, deactivate the user to preserve data integrity
    user.isActive = false;
    await user.save();

    res.json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: "Failed to delete user",
      details: error.message,
    });
  }
};

/**
 * Get user statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, employeeCount, adminCount, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "employee" }),
      User.countDocuments({ role: "administrator" }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      employeeCount,
      adminCount,
      recentUsers,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      error: "Failed to get user statistics",
      details: error.message,
    });
  }
};

/**
 * Reset user password (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({
      error: "Failed to reset password",
      details: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  resetUserPassword,
};
