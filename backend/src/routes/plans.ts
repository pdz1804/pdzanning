import express from "express";
import { z } from "zod";
import Plan from "../models/Plan";
import Task from "../models/Task";
import User from "../models/User";
import { authenticateToken } from "../middleware/auth";
import { requirePlanAccess } from "../middleware/planAccess";
import { validateRequest } from "../utils/validation";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Create plan schema
const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(100, "Plan name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

// Get user's plans
router.get("/", async (req, res) => {
  try {
    const userId = req.user!._id;

    // Find plans where user is owner or member
    const plans = await Plan.find({
      $or: [
        { owner_id: userId },
        { "members.user_id": userId }
      ]
    })
    .populate('owner_id', 'name email')
    .populate('members.user_id', 'name email')
    .sort({ created_at: -1 });

    res.json({ plans });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create new plan
router.post("/", validateRequest(z.object({
  body: createPlanSchema
})), async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!._id;

    const plan = new Plan({
      name,
      description,
      owner_id: userId,
      members: [] // Owner is not in members array
    });

    await plan.save();
    await plan.populate('owner_id', 'name email');

    console.log(`Created plan "${name}" with owner ${req.user!.email}`);

    res.status(201).json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// Get plan details
router.get("/:plan_id", requirePlanAccess("viewer"), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.plan_id)
      .populate('owner_id', 'name email')
      .populate('members.user_id', 'name email');

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get task count
    const taskCount = await Task.countDocuments({ plan_id: plan._id });

    res.json({
      ...plan.toObject(),
      task_count: taskCount
    });
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

// Update plan
router.patch("/:plan_id", validateRequest(z.object({
  body: createPlanSchema.partial()
})), requirePlanAccess("owner"), async (req, res) => {
  try {
    const { name, description } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.plan_id,
      { name, description },
      { new: true, runValidators: true }
    ).populate('owner_id', 'name email')
     .populate('members.user_id', 'name email');

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// Delete plan
router.delete("/:plan_id", requirePlanAccess("owner"), async (req, res) => {
  try {
    // Delete all tasks in the plan first
    await Task.deleteMany({ plan_id: req.params.plan_id });
    
    // Delete the plan
    await Plan.findByIdAndDelete(req.params.plan_id);

    console.log(`Deleted plan ${req.params.plan_id} and all its tasks`);

    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

// Add member to plan
router.post("/:plan_id/members", validateRequest(z.object({
  body: z.object({
    user_id: z.string().min(1, "User ID is required"),
    role: z.enum(["editor", "viewer"]).default("viewer")
  })
})), requirePlanAccess("owner"), async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const plan = req.plan!;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already owner
    if (plan.owner_id.toString() === user_id) {
      return res.status(400).json({ error: "User is already the owner" });
    }

    // Check if user is already a member
    const existingMember = plan.members.find(m => m.user_id.toString() === user_id);
    if (existingMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add member
    plan.members.push({
      user_id: user_id as any,
      role,
      joined_at: new Date()
    });

    await plan.save();
    await plan.populate('members.user_id', 'name email');

    console.log(`Added ${user.email} as ${role} to plan ${plan.name}`);

    res.json(plan);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member from plan
router.delete("/:plan_id/members/:user_id", requirePlanAccess("owner"), async (req, res) => {
  try {
    const { user_id } = req.params;
    const plan = req.plan!;

    // Remove member
    plan.members = plan.members.filter(m => m.user_id.toString() !== user_id);
    await plan.save();
    await plan.populate('members.user_id', 'name email');

    console.log(`Removed user ${user_id} from plan ${plan.name}`);

    res.json(plan);
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Update member role
router.patch("/:plan_id/members/:user_id", validateRequest(z.object({
  body: z.object({
    role: z.enum(["editor", "viewer"])
  })
})), requirePlanAccess("owner"), async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role } = req.body;
    const plan = req.plan!;

    // Update member role
    const member = plan.members.find(m => m.user_id.toString() === user_id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    member.role = role;
    await plan.save();
    await plan.populate('members.user_id', 'name email');

    console.log(`Updated role of user ${user_id} to ${role} in plan ${plan.name}`);

    res.json(plan);
  } catch (error) {
    console.error("Update member role error:", error);
    res.status(500).json({ error: "Failed to update member role" });
  }
});

export default router;