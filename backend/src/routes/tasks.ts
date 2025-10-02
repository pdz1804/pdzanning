import express from "express";
import { z } from "zod";
import Task from "../models/Task";
import User from "../models/User";
import { authenticateToken } from "../middleware/auth";
import { requirePlanAccess } from "../middleware/planAccess";
import { validateRequest } from "../utils/validation";
import { taskSchema, taskUpdateSchema, bulkTaskSchema, reorderTasksSchema } from "../schemas/task";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get tasks with filtering and pagination
router.get("/", requirePlanAccess("viewer"), async (req, res) => {
  try {
    const {
      plan_id,
      q, // search query
      status,
      assignee,
      tag,
      priority,
      parent_id,
      page = "1",
      limit = "50",
      sort = "order_index",
      order = "asc"
    } = req.query;

    if (!plan_id) {
      return res.status(400).json({ error: "plan_id is required" });
    }

    // Build query
    const query: any = { plan_id: plan_id };

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (assignee) {
      query.assignee_ids = Array.isArray(assignee) ? { $in: assignee } : assignee;
    }

    if (tag) {
      query.tags = Array.isArray(tag) ? { $in: tag } : { $in: [tag] };
    }

    if (priority) {
      query.priority = Array.isArray(priority) ? { $in: priority } : priority;
    }

    if (parent_id !== undefined) {
      query.parent_id = parent_id === "null" ? null : parent_id;
    }

    // Text search
    if (q) {
      query.$text = { $search: q as string };
    }

    // Build sort object
    const sortObj: any = {};
    if (sort === "order_index") {
      sortObj.status = 1;
      sortObj.order_index = order === "desc" ? -1 : 1;
    } else {
      sortObj[sort as string] = order === "desc" ? -1 : 1;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignee_ids", "name avatar email")
        .populate("created_by", "name email")
        .populate("updated_by", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(query)
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create task
router.post("/", validateRequest(z.object({
  body: taskSchema
})), requirePlanAccess("editor"), async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      plan_id: req.body.plan_id, // Convert string to ObjectId will happen automatically
      created_by: req.user!._id,
      updated_by: req.user!._id,
    };

    // Validate parent_id exists and is in same plan
    if (taskData.parent_id) {
      const parent = await Task.findOne({ _id: taskData.parent_id, plan_id: taskData.plan_id });
      if (!parent) {
        return res.status(400).json({ error: "Parent task not found or not in same plan" });
      }
    }

    // Validate dependency_ids exist and are in same plan
    if (taskData.dependency_ids && taskData.dependency_ids.length > 0) {
      const dependencies = await Task.find({ 
        _id: { $in: taskData.dependency_ids }, 
        plan_id: taskData.plan_id 
      });
      if (dependencies.length !== taskData.dependency_ids.length) {
        return res.status(400).json({ error: "Some dependencies not found or not in same plan" });
      }
    }

    // Set order_index if not provided
    if (taskData.order_index === undefined) {
      const maxOrder = await Task.findOne({ plan_id: taskData.plan_id, status: taskData.status })
        .sort({ order_index: -1 });
      taskData.order_index = (maxOrder?.order_index || 0) + 1;
    }

    const task = new Task(taskData);
    await task.save();

    await task.populate([
      { path: "assignee_ids", select: "name avatar email" },
      { path: "created_by", select: "name email" },
      { path: "updated_by", select: "name email" }
    ]);

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.patch("/:id", validateRequest(z.object({
  body: taskUpdateSchema
})), requirePlanAccess("editor"), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, plan_id: req.query.plan_id });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Validate parent_id if being updated
    if (req.body.parent_id !== undefined) {
      if (req.body.parent_id && req.body.parent_id !== task.parent_id) {
        const parent = await Task.findOne({ 
          _id: req.body.parent_id, 
          plan_id: task.plan_id 
        });
        if (!parent) {
          return res.status(400).json({ error: "Parent task not found or not in same plan" });
        }
      }
    }

    // Validate dependency_ids if being updated
    if (req.body.dependency_ids !== undefined) {
      if (req.body.dependency_ids.length > 0) {
        const dependencies = await Task.find({ 
          _id: { $in: req.body.dependency_ids }, 
          plan_id: task.plan_id 
        });
        if (dependencies.length !== req.body.dependency_ids.length) {
          return res.status(400).json({ error: "Some dependencies not found or not in same plan" });
        }
      }
    }

    // Update task
    Object.assign(task, req.body);
    task.updated_by = req.user!._id;
    await task.save();

    await task.populate([
      { path: "assignee_ids", select: "name avatar email" },
      { path: "created_by", select: "name email" },
      { path: "updated_by", select: "name email" }
    ]);

    res.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
router.delete("/:id", requirePlanAccess("editor"), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, plan_id: req.query.plan_id });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if task has children
    const hasChildren = await Task.findOne({ parent_id: req.params.id });
    if (hasChildren) {
      return res.status(400).json({ 
        error: "Cannot delete task with subtasks. Delete subtasks first or use cascade delete." 
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Bulk operations
router.post("/bulk", validateRequest(z.object({
  body: bulkTaskSchema
})), requirePlanAccess("editor"), async (req, res) => {
  try {
    const { tasks, plan_id } = req.body;
    const userId = req.user!._id;

    // Validate all tasks first
    for (const taskData of tasks) {
      // Validate parent_id
      if (taskData.parent_id) {
        const parentExists = tasks.some(t => t._id === taskData.parent_id) || 
          await Task.findOne({ _id: taskData.parent_id, plan_id });
        if (!parentExists) {
          return res.status(400).json({ 
            error: `Parent task ${taskData.parent_id} not found for task ${taskData.title}` 
          });
        }
      }

      // Validate dependencies
      if (taskData.dependency_ids && taskData.dependency_ids.length > 0) {
        const validDeps = tasks.filter(t => taskData.dependency_ids!.includes(t._id));
        const existingDeps = await Task.find({ 
          _id: { $in: taskData.dependency_ids }, 
          plan_id 
        });
        
        if (validDeps.length + existingDeps.length !== taskData.dependency_ids.length) {
          return res.status(400).json({ 
            error: `Some dependencies not found for task ${taskData.title}` 
          });
        }
      }
    }

    // Insert tasks
    const tasksToInsert = tasks.map(taskData => ({
      ...taskData,
      plan_id,
      created_by: userId,
      updated_by: userId,
    }));

    const createdTasks = await Task.insertMany(tasksToInsert);

    res.status(201).json({
      message: `${createdTasks.length} tasks created successfully`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("Bulk create tasks error:", error);
    res.status(500).json({ error: "Failed to create tasks" });
  }
});

// Reorder tasks
router.post("/reorder", validateRequest(z.object({
  body: reorderTasksSchema
})), requirePlanAccess("editor"), async (req, res) => {
  try {
    const { task_ids, plan_id } = req.body;

    // Update order_index for each task
    const updates = task_ids.map((taskId: string, index: number) => ({
      updateOne: {
        filter: { _id: taskId, plan_id },
        update: { order_index: index + 1, updated_by: req.user!._id },
      },
    }));

    const result = await Task.bulkWrite(updates);
    res.json({ message: "Tasks reordered successfully", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Reorder tasks error:", error);
    res.status(500).json({ error: "Failed to reorder tasks" });
  }
});

export default router;

