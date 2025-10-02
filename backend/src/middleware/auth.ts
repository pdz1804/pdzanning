import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.userId).select('-password_hash');
    
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const requirePlanAccess = (requiredRole: "owner" | "editor" | "viewer" = "viewer") => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for plan_id in params (for routes like /plans/:plan_id/export) or query (for /tasks?plan_id=...)
    const plan_id = req.params.plan_id || req.query.plan_id;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!plan_id) {
      return res.status(400).json({ error: "plan_id is required" });
    }

    // Check if user has access to this plan
    const userRole = user.plan_roles?.get(plan_id as string);
    if (!userRole) {
      console.log(`User ${user.email} has no access to plan ${plan_id}. Available plans:`, Array.from(user.plan_roles?.keys() || []));
      return res.status(403).json({ error: "No access to this plan" });
    }

    // Check role hierarchy: owner > editor > viewer
    const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: `Requires ${requiredRole} access or higher` 
      });
    }

    next();
  };
};

