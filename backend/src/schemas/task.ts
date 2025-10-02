import { z } from "zod";

// Define base schema without refinements so we can safely use .partial() on it
const taskBaseSchema = z.object({
  plan_id: z.string().min(1, "Plan ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_ids: z.array(z.string()).optional(),
  start_date: z.string().optional(), // ISO date string
  due_date: z.string().optional(),   // ISO date string
  progress_pct: z.number().min(0).max(100).optional(),
  parent_id: z.string().optional(),
  dependency_ids: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  estimate_hours: z.number().min(0).optional(),
  order_index: z.number().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
  deliverables: z.string().optional(),
});

// Creation/update validation with additional cross-field checks
export const taskSchema = taskBaseSchema.refine((data) => {
  // Validate that due_date is after start_date if both exist
  if (data.start_date && data.due_date) {
    return new Date(data.due_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "Due date must be after start date",
  path: ["due_date"]
});

// For PATCH updates, allow partial fields; omit plan_id to avoid accidental plan moves
export const taskUpdateSchema = taskBaseSchema.partial().omit({ plan_id: true });

export const bulkTaskSchema = z.object({
  tasks: z.array(taskSchema),
  plan_id: z.string().min(1, "Plan ID is required"),
});

export const reorderTasksSchema = z.object({
  task_ids: z.array(z.string()),
  plan_id: z.string().min(1, "Plan ID is required"),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type BulkTaskInput = z.infer<typeof bulkTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

