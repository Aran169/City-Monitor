const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const nodemailer = require("nodemailer");
const router = express.Router();
const app = express();
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(
  cors({
    origin: "*", // You can specify specific origins here, e.g., ['https://citymonitor.netlify.app']
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use("/api", router); // This mounts all routes under "/api"

app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://City-Monitor:citymonitor1234@city-monitor.04fdi.mongodb.net/City-Monitor",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB connection error:", error));

// User Schema
const crypto = require("crypto");
const User = require("./models/user"); // Adjust the path if needed

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Registration Route
// Registration Route using app.post
app.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    user = new User({
      fullName,
      email,
      password: hashedPassword,
      isVerified: false, // Initially, the user is not verified
    });

    // Save the user to the database
    await user.save();

    // Generate a verification token
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

    // Send verification email with the verification link
    const verificationLink = `https://citymonitor.netlify.app/verify-email/${token}`;
    await transporter.sendMail({
      from: '"City Monitor" muruganarul1693@gmail.com',
      to: email,
      subject: "Verify Your Email",
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
    });

    // Respond with a success message
    res.json({
      message: "Registration successful! Please check your email for verification.",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// Email Verification Route using app.get
app.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    // Decode the token to get the email
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user by email and update the `isVerified` field
    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { isVerified: true },
      { new: true } // This option ensures the updated document is returned
    );

    if (!user) {
      return res.status(400).json({ message: "User not found or already verified" });
    }

    res.json({ message: "Email verification successful!" });
  } catch (error) {
    // Handle specific error cases for token verification
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired. Please request a new verification email." });
    }
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Send success response with user data
    res.status(200).json({
      message: "Login successful",
      user: { fullName: user.fullName, email: user.email }, // Send user details
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Google Login Route
app.post("/google-login", async (req, res) => {
  const { fullName, email } = req.body;

  try {
    console.log("Received Google login request:", req.body); // Log the received data

    // Check if user already exists in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User not found. Creating new user...");
      // If the user doesn't exist, create a new one
      user = new User({
        fullName,
        email,
        password: "", // For Google login, you may not have a password
        googleLogin: true, // Mark user as logged in via Google
      });
      await user.save();
      console.log("New user created:", user);
    } else {
      console.log("User found in DB:", user);
    }

    // Send success response with user data
    res.status(200).json({
      message: "Google login successful",
      user: { fullName: user.displayName, email: user.email },
    });
  } catch (error) {
    console.error("Error during Google login:", error);
    res.status(500).json({ message: "Error during Google login", error });
  }
});

// Forgot Password Route
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    // Send email with reset link
    

    const resetLink = `https://citymonitor.netlify.app/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset email sent!" });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Error sending reset email" });
  }
});

app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Listen on a port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
