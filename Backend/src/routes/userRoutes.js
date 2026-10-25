const express = require("express");

const {
  getUsers,
  registerUser,
  loginUser,
  getMyProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all users
router.get("/", protect, adminOnly, getUsers);

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Google Login
router.post("/google-login", googleLogin);

// Protected Profile
router.get("/profile", protect, getMyProfile);

module.exports = router;