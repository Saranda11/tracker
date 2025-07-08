const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const updateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .trim(),
  body("lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .trim(),
  body("email").optional().isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department must be less than 100 characters")
    .trim(),
  body("role")
    .optional()
    .isIn(["employee", "administrator"])
    .withMessage("Role must be either employee or administrator"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean value"),
];

const userIdValidation = [param("id").isMongoId().withMessage("Invalid user ID")];

const resetPasswordValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management routes
router.get("/", userController.getAllUsers);
router.get("/stats", userController.getUserStats);
router.get("/:id", userIdValidation, userController.getUserById);
router.put("/:id", updateUserValidation, userController.updateUser);
router.delete("/:id", userIdValidation, userController.deleteUser);
router.put("/:id/reset-password", resetPasswordValidation, userController.resetUserPassword);

module.exports = router;
