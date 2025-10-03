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

// Export plan with all tasks
router.get("/:plan_id/export", requirePlanAccess("viewer"), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.plan_id)
      .populate('owner_id', 'name email')
      .populate('members.user_id', 'name email');

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Get all tasks for this plan
    const tasks = await Task.find({ plan_id: plan._id })
      .populate('assignee_ids', 'name email')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ order_index: 1 });

    // Create export data (without user IDs/names for privacy and reusability)
    const exportData = {
      plan: {
        name: plan.name,
        description: plan.description,
        members: plan.members.map(member => ({
          name: (member.user_id as any).name,
          email: (member.user_id as any).email,
          role: member.role
        }))
      },
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignees: task.assignee_ids?.map(assignee => ({
          name: (assignee as any).name,
          email: (assignee as any).email
        })) || [],
        start_date: task.start_date,
        due_date: task.due_date,
        progress_pct: task.progress_pct,
        parent_id: task.parent_id,
        dependency_ids: task.dependency_ids || [],
        tags: task.tags || [],
        estimate_hours: task.estimate_hours,
        order_index: task.order_index,
        goal: task.goal,
        notes: task.notes,
        deliverables: task.deliverables
      })),
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by: {
          name: req.user!.name,
          email: req.user!.email
        },
        version: "1.0"
      }
    };

    // Set headers for file download
    const filename = `plan-${plan.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(exportData);
  } catch (error) {
    console.error("Export plan error:", error);
    res.status(500).json({ error: "Failed to export plan" });
  }
});

// Import plan from JSON data
router.post("/import", validateRequest(z.object({
  body: z.object({
    plan_data: z.object({
      plan: z.object({
        name: z.string().min(1, "Plan name is required").max(100, "Plan name too long"),
        description: z.string().max(500, "Description too long").optional(),
        members: z.array(z.object({
          name: z.string(),
          email: z.string().email(),
          role: z.enum(["editor", "viewer"]).default("viewer")
        })).optional().default([])
      }),
      tasks: z.array(z.object({
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "done"]).default("todo"),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assignees: z.array(z.object({
          name: z.string(),
          email: z.string().email()
        })).optional().default([]),
        start_date: z.string().optional().nullable(),
        due_date: z.string().optional().nullable(),
        progress_pct: z.number().min(0).max(100).optional().default(0),
        parent_id: z.string().optional().nullable(),
        dependency_ids: z.array(z.string()).optional().default([]),
        tags: z.array(z.string()).optional().default([]),
        estimate_hours: z.number().positive().optional().nullable(),
        order_index: z.number().optional().default(0),
        goal: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        deliverables: z.string().optional().nullable()
      })).optional().default([])
    })
  })
})), async (req, res) => {
  try {
    const { plan_data } = req.body;
    const userId = req.user!._id;
    
    console.log('Import request received:', {
      planName: plan_data?.plan?.name,
      memberCount: plan_data?.plan?.members?.length,
      taskCount: plan_data?.tasks?.length
    });

    // Create the plan
    const plan = new Plan({
      name: plan_data.plan.name,
      description: plan_data.plan.description,
      owner_id: userId,
      members: [] // Owner is not in members array
    });

    await plan.save();

    // Process members - find existing users by email or create placeholder entries
    const memberPromises = plan_data.plan.members.map(async (memberData: any) => {
      try {
        // Try to find existing user by email
        const existingUser = await User.findOne({ email: memberData.email });
        if (existingUser) {
          return {
            user_id: existingUser._id,
            role: memberData.role,
            joined_at: new Date()
          };
        } else {
          // Create a placeholder user entry (they'll need to register to access)
          const placeholderUser = new User({
            name: memberData.name,
            email: memberData.email,
            password_hash: 'placeholder', // Will be updated when they register
            is_placeholder: true
          });
          await placeholderUser.save();
          return {
            user_id: placeholderUser._id,
            role: memberData.role,
            joined_at: new Date()
          };
        }
      } catch (error) {
        console.error(`Failed to process member ${memberData.email}:`, error);
        return null;
      }
    });

    const processedMembers = (await Promise.all(memberPromises)).filter(Boolean);
    plan.members = processedMembers;
    await plan.save();

    // Process tasks
    const taskPromises = plan_data.tasks.map(async (taskData: any, index: number) => {
      try {
        // Process assignees - find existing users or create placeholders
        const assigneePromises = taskData.assignees.map(async (assigneeData: any) => {
          try {
            const existingUser = await User.findOne({ email: assigneeData.email });
            if (existingUser) {
              return existingUser._id;
            } else {
              const placeholderUser = new User({
                name: assigneeData.name,
                email: assigneeData.email,
                password_hash: 'placeholder',
                is_placeholder: true
              });
              await placeholderUser.save();
              return placeholderUser._id;
            }
          } catch (error) {
            console.error(`Failed to process assignee ${assigneeData.email}:`, error);
            return null;
          }
        });

        const assigneeIds = (await Promise.all(assigneePromises)).filter(Boolean);

        const task = new Task({
          plan_id: plan._id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assignee_ids: assigneeIds,
          start_date: taskData.start_date,
          due_date: taskData.due_date,
          progress_pct: taskData.progress_pct,
          parent_id: taskData.parent_id,
          dependency_ids: taskData.dependency_ids,
          tags: taskData.tags,
          estimate_hours: taskData.estimate_hours,
          order_index: taskData.order_index || index,
          goal: taskData.goal,
          notes: taskData.notes,
          deliverables: taskData.deliverables,
          created_by: userId,
          updated_by: userId
        });

        await task.save();
        return task;
      } catch (error) {
        console.error(`Failed to create task ${taskData.title}:`, error);
        return null;
      }
    });

    const createdTasks = (await Promise.all(taskPromises)).filter(Boolean);

    // Populate the plan with owner and members
    await plan.populate('owner_id', 'name email');
    await plan.populate('members.user_id', 'name email');

    console.log(`Imported plan "${plan.name}" with ${createdTasks.length} tasks`);

    res.status(201).json({
      plan,
      tasks_created: createdTasks.length,
      message: "Plan imported successfully"
    });
  } catch (error: unknown) {
    console.error("Import plan error:", error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: "Validation failed", 
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      });
    }
    res.status(500).json({ error: "Failed to import plan" });
  }
});

export default router;