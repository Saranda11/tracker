const Expense = require("../models/Expense");

/**
 * Fraud Detection Utility
 * Implements various fraud detection algorithms
 */

class FraudDetector {
  /**
   * Main fraud detection function
   * @param {Object} expense - The expense to check
   * @returns {Object} - Detection result with isFlagged and reason
   */
  static async detectFraud(expense) {
    const detectionResults = [];

    // Check for duplicate amounts within time window
    const duplicateCheck = await this.checkDuplicateAmounts(expense);
    if (duplicateCheck.isFlagged) {
      detectionResults.push(duplicateCheck);
    }

    // Check for suspicious patterns
    const patternCheck = await this.checkSuspiciousPatterns(expense);
    if (patternCheck.isFlagged) {
      detectionResults.push(patternCheck);
    }

    // Check for amount thresholds
    const amountCheck = this.checkAmountThresholds(expense);
    if (amountCheck.isFlagged) {
      detectionResults.push(amountCheck);
    }

    // Check for rapid submissions
    const rapidCheck = await this.checkRapidSubmissions(expense);
    if (rapidCheck.isFlagged) {
      detectionResults.push(rapidCheck);
    }

    // Combine results
    const isFlagged = detectionResults.length > 0;
    const reasons = detectionResults.map((result) => result.reason).join("; ");

    return {
      isFlagged,
      reason: reasons,
      details: detectionResults,
    };
  }

  /**
   * Check for duplicate amounts within 60 minutes
   * @param {Object} expense - The expense to check
   * @returns {Object} - Detection result
   */
  static async checkDuplicateAmounts(expense) {
    const timeWindow = 60 * 60 * 1000; // 60 minutes in milliseconds
    const startTime = new Date(expense.date.getTime() - timeWindow);
    const endTime = new Date(expense.date.getTime() + timeWindow);

    try {
      const duplicateExpenses = await Expense.find({
        userId: expense.userId,
        amount: expense.amount,
        date: {
          $gte: startTime,
          $lte: endTime,
        },
        _id: { $ne: expense._id }, // Exclude the current expense
      });

      if (duplicateExpenses.length > 0) {
        return {
          isFlagged: true,
          reason: `Duplicate amount ($${expense.amount}) found within 60 minutes`,
          relatedExpenses: duplicateExpenses.map((exp) => ({
            id: exp._id,
            date: exp.date,
            timeDifference: Math.abs(expense.date - exp.date) / (1000 * 60), // in minutes
          })),
        };
      }
    } catch (error) {
      console.error("Error checking duplicate amounts:", error);
    }

    return { isFlagged: false };
  }

  /**
   * Check for suspicious patterns (e.g., round numbers, frequent submissions)
   * @param {Object} expense - The expense to check
   * @returns {Object} - Detection result
   */
  static async checkSuspiciousPatterns(expense) {
    const suspiciousPatterns = [];

    // Check for round numbers (multiples of 10, 25, 50, 100)
    if (expense.amount % 100 === 0 || expense.amount % 50 === 0 || expense.amount % 25 === 0) {
      suspiciousPatterns.push("Round number amount");
    }

    // Check for very similar descriptions
    const similarExpenses = await Expense.find({
      userId: expense.userId,
      description: { $regex: expense.description, $options: "i" },
      _id: { $ne: expense._id },
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    });

    if (similarExpenses.length > 2) {
      suspiciousPatterns.push("Similar descriptions in recent submissions");
    }

    if (suspiciousPatterns.length > 0) {
      return {
        isFlagged: true,
        reason: suspiciousPatterns.join("; "),
      };
    }

    return { isFlagged: false };
  }

  /**
   * Check for amount thresholds
   * @param {Object} expense - The expense to check
   * @returns {Object} - Detection result
   */
  static checkAmountThresholds(expense) {
    const HIGH_AMOUNT_THRESHOLD = 1000;
    const VERY_HIGH_AMOUNT_THRESHOLD = 5000;

    if (expense.amount >= VERY_HIGH_AMOUNT_THRESHOLD) {
      return {
        isFlagged: true,
        reason: `Very high amount ($${expense.amount}) requires additional review`,
      };
    }

    if (expense.amount >= HIGH_AMOUNT_THRESHOLD) {
      return {
        isFlagged: true,
        reason: `High amount ($${expense.amount}) flagged for review`,
      };
    }

    return { isFlagged: false };
  }

  /**
   * Check for rapid submissions (too many expenses in short time)
   * @param {Object} expense - The expense to check
   * @returns {Object} - Detection result
   */
  static async checkRapidSubmissions(expense) {
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    const startTime = new Date(expense.date.getTime() - timeWindow);

    try {
      const recentExpenses = await Expense.find({
        userId: expense.userId,
        createdAt: {
          $gte: startTime,
        },
        _id: { $ne: expense._id },
      });

      if (recentExpenses.length >= 5) {
        return {
          isFlagged: true,
          reason: `Too many submissions (${recentExpenses.length + 1}) within 30 minutes`,
        };
      }
    } catch (error) {
      console.error("Error checking rapid submissions:", error);
    }

    return { isFlagged: false };
  }

  /**
   * Get fraud statistics for admin dashboard
   * @returns {Object} - Fraud statistics
   */
  static async getFraudStatistics() {
    try {
      const totalExpenses = await Expense.countDocuments();
      const flaggedExpenses = await Expense.countDocuments({ isFlagged: true });
      const pendingReview = await Expense.countDocuments({
        isFlagged: true,
        status: "pending",
      });

      return {
        totalExpenses,
        flaggedExpenses,
        pendingReview,
        fraudRate: totalExpenses > 0 ? ((flaggedExpenses / totalExpenses) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      console.error("Error getting fraud statistics:", error);
      return {
        totalExpenses: 0,
        flaggedExpenses: 0,
        pendingReview: 0,
        fraudRate: 0,
      };
    }
  }
}

module.exports = FraudDetector;
