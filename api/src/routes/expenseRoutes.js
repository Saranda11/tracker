const express = require("express");
const { body, param } = require("express-validator");
const expenseController = require("../controllers/expenseController");
const { authenticateToken, requireAdmin, requireEmployee } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createExpenseValidation = [
  body("amount").isFloat({ min: 0.01, max: 10000 }).withMessage("Amount must be between 0.01 and 10000").toFloat(),
  body("category")
    .isIn(["meals", "transportation", "accommodation", "office_supplies", "travel", "entertainment", "other"])
    .withMessage(
      "Category must be one of: meals, transportation, accommodation, office_supplies, travel, entertainment, other"
    ),
  body("description")
    .isLength({ min: 1, max: 500 })
    .withMessage("Description is required and must be less than 500 characters")
    .trim(),
  body("date").optional().isISO8601().withMessage("Date must be in ISO format").toDate(),
  body("receiptUrl").optional().isURL().withMessage("Receipt URL must be a valid URL"),
];

const updateExpenseValidation = [
  param("id").isMongoId().withMessage("Invalid expense ID"),
  body("amount")
    .optional()
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage("Amount must be between 0.01 and 10000")
    .toFloat(),
  body("category")
    .optional()
    .isIn(["meals", "transportation", "accommodation", "office_supplies", "travel", "entertainment", "other"])
    .withMessage(
      "Category must be one of: meals, transportation, accommodation, office_supplies, travel, entertainment, other"
    ),
  body("description")
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage("Description must be less than 500 characters")
    .trim(),
  body("date").optional().isISO8601().withMessage("Date must be in ISO format").toDate(),
  body("receiptUrl").optional().isURL().withMessage("Receipt URL must be a valid URL"),
];

const expenseIdValidation = [param("id").isMongoId().withMessage("Invalid expense ID")];

const reviewExpenseValidation = [
  param("id").isMongoId().withMessage("Invalid expense ID"),
  body("notes").optional().isLength({ max: 1000 }).withMessage("Notes must be less than 1000 characters").trim(),
];

// All routes require authentication
router.use(authenticateToken);

// Employee routes (employees can access their own expenses)
router.post("/", requireEmployee, createExpenseValidation, expenseController.createExpense);
router.get("/", requireEmployee, expenseController.getExpenses);
router.get("/stats", requireEmployee, expenseController.getExpenseStats);
router.get("/:id", requireEmployee, expenseIdValidation, expenseController.getExpenseById);
router.put("/:id", requireEmployee, updateExpenseValidation, expenseController.updateExpense);
router.delete("/:id", requireEmployee, expenseIdValidation, expenseController.deleteExpense);

// Admin only routes (for approving/rejecting expenses)
router.put("/:id/approve", requireAdmin, reviewExpenseValidation, expenseController.approveExpense);
router.put("/:id/reject", requireAdmin, reviewExpenseValidation, expenseController.rejectExpense);

// Analytics routes (admin only)
router.get("/analytics/monthly-trends", requireAdmin, expenseController.getMonthlyTrends);
router.get("/analytics/category-breakdown", requireAdmin, expenseController.getCategoryBreakdown);
router.get("/analytics/department-performance", requireAdmin, expenseController.getDepartmentPerformance);

module.exports = router;
