import { Request, Response, NextFunction } from "express";
import Plan, { IPlan } from "../models/Plan";
import User from "../models/User";

// Extend Express Request type to include plan
declare global {
  namespace Express {
    interface Request {
      plan?: IPlan;
      userRole?: "owner" | "editor" | "viewer";
    }
  }
}

export const requirePlanAccess = (requiredRole: "owner" | "editor" | "viewer" = "viewer") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for plan_id in params, query, or body
      const plan_id = req.params.plan_id || req.query.plan_id || req.body.plan_id;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!plan_id) {
        return res.status(400).json({ error: "plan_id is required" });
      }

      // Find the plan
      const plan = await Plan.findById(plan_id).populate('owner_id', 'name email');
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Check if user is the owner
      if (plan.owner_id._id.toString() === user._id.toString()) {
        req.plan = plan;
        req.userRole = "owner";
      } else {
        // Check if user is a member
        const member = plan.members.find(m => m.user_id.toString() === user._id.toString());
        if (!member) {
          console.log(`User ${user.email} has no access to plan ${plan_id}`);
          return res.status(403).json({ error: "No access to this plan" });
        }
        req.plan = plan;
        req.userRole = member.role;
      }

      // Check role hierarchy: owner > editor > viewer
      const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
      const userRoleLevel = roleHierarchy[req.userRole];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          error: `Requires ${requiredRole} access or higher` 
        });
      }

      next();
    } catch (error) {
      console.error("Plan access check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Helper function to get user's role in a plan
export const getUserPlanRole = async (userId: string, planId: string): Promise<"owner" | "editor" | "viewer" | null> => {
  try {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    // Check if user is the owner
    if (plan.owner_id.toString() === userId) {
      return "owner";
    }

    // Check if user is a member
    const member = plan.members.find(m => m.user_id.toString() === userId);
    return member ? member.role : null;
  } catch (error) {
    console.error("Error getting user plan role:", error);
    return null;
  }
};

// Helper function to check if user has access to a plan
export const hasPlanAccess = async (userId: string, planId: string, requiredRole: "owner" | "editor" | "viewer" = "viewer"): Promise<boolean> => {
  const userRole = await getUserPlanRole(userId, planId);
  if (!userRole) return false;

  const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
