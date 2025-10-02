import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import morgan from "morgan";

// Import routes
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import planRoutes from "./routes/plans";
import Plan from "./models/Plan";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Request logging
app.use(morgan(process.env.LOG_FORMAT || "dev"));

// Rate limiting
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // more generous in production but behind WAF/CDN typically
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);
} else {
  // In development, keep a very high threshold to avoid throttling interactive actions (drag/drop)
  const devLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests (dev)",
  });
  app.use("/api/", devLimiter);
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/tasks", taskRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    if (process.env.MONGOOSE_DEBUG === "true") {
      mongoose.set("debug", true);
      console.log("Mongoose debug enabled");
    }

    // Connection lifecycle logs
    mongoose.connection.on("connected", () => {
      const dbName = mongoose.connection.db?.databaseName;
      console.log(`Mongo connected (${dbName || "unknown db"})`);
    });
    mongoose.connection.on("reconnected", () => {
      console.log("Mongo reconnected");
    });
    mongoose.connection.on("disconnected", () => {
      console.log("Mongo disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("Mongo connection error:", err);
    });

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
    
    // Create default demo plan if it doesn't exist
    await createDefaultDemoPlan();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Create default demo plan
const createDefaultDemoPlan = async () => {
  try {
    const existingPlan = await Plan.findOne({ name: "Demo Plan" });
    if (!existingPlan) {
      // Create a demo plan with a dummy owner (we'll update this when users register)
      const demoPlan = new Plan({
        name: "Demo Plan",
        description: "A demo plan for testing and getting started",
        owner_id: new mongoose.Types.ObjectId(), // Temporary dummy ID
        members: []
      });
      await demoPlan.save();
      console.log("Created default demo plan");
    }
  } catch (error) {
    console.error("Error creating demo plan:", error);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`CORS allowed origins: ${(process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").join(", ")}`);
  });
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

