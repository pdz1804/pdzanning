import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User";
import Plan from "../models/Plan";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { authenticateToken } from "../middleware/auth";
import { validateRequest } from "../utils/validation";

const router = express.Router();

// Register
router.post("/register", validateRequest(z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
  })
})), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email,
      password_hash,
      name,
      avatar: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
    });

    await user.save();
    console.log(`Created user ${email}`);

    // Make user owner of demo plan if it exists
    const demoPlan = await Plan.findOne({ name: "Demo Plan" });
    if (demoPlan) {
      demoPlan.owner_id = user._id;
      await demoPlan.save();
      console.log(`Made ${email} owner of Demo Plan`);
    }

    // Generate tokens
    const payload = { userId: user._id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", validateRequest(z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
})), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const payload = { userId: user._id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({ userId: user._id, email: user.email });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = req.user!;
    console.log(`Getting user info for ${user.email}`);
    
    // Get user's plans
    const plans = await Plan.find({
      $or: [
        { owner_id: user._id },
        { "members.user_id": user._id }
      ]
    }).populate('owner_id', 'name email')
      .populate('members.user_id', 'name email')
      .select('name _id owner_id members');

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      plans: plans.map(plan => {
        const isOwner = plan.owner_id && plan.owner_id._id.toString() === user._id.toString();
        const memberRole = plan.members.find(m => 
          m.user_id && m.user_id._id.toString() === user._id.toString()
        )?.role;
        
        return {
          _id: plan._id,
          name: plan.name,
          role: isOwner ? 'owner' : (memberRole || 'viewer')
        };
      })
    });
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});


export default router;

