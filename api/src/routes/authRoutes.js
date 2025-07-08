const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticateToken, authRateLimit } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("firstName")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name is required and must be less than 50 characters")
    .trim(),
  body("lastName")
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name is required and must be less than 50 characters")
    .trim(),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department must be less than 100 characters")
    .trim(),
  body("role")
    .optional()
    .isIn(["employee", "administrator"])
    .withMessage("Role must be either employee or administrator"),
];

const loginValidation = [
  body("username").isLength({ min: 1 }).withMessage("Username or email is required").trim(),
  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

const updateProfileValidation = [
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
];

const changePasswordValidation = [
  body("currentPassword").isLength({ min: 1 }).withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

// Public routes (with rate limiting)
router.post("/register", authRateLimit(), registerValidation, authController.register);
router.post("/login", authRateLimit(), loginValidation, authController.login);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, updateProfileValidation, authController.updateProfile);
router.put("/change-password", authenticateToken, changePasswordValidation, authController.changePassword);
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
