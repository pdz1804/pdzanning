import { z } from "zod";

export const exportPlanSchema = z.object({
  schema_version: z.literal("1.0"),
  exported_at: z.string(),
  plan_id: z.string(),
  plan_title: z.string(),
  users_map: z.record(z.object({
    display_name: z.string(),
    email: z.string().email(),
  })),
  tasks: z.array(z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee_ids: z.array(z.string()).optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    progress_pct: z.number().min(0).max(100).optional(),
    parent_id: z.string().optional(),
    dependency_ids: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    estimate_hours: z.number().optional(),
    order_index: z.number().optional(),
  }))
});

export const importPlanSchema = z.object({
  schema_version: z.literal("1.0"),
  exported_at: z.string(),
  plan_id: z.string(),
  plan_title: z.string(),
  users_map: z.record(z.object({
    display_name: z.string(),
    email: z.string().email(),
  })),
  tasks: z.array(z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee_ids: z.array(z.string()).optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    progress_pct: z.number().min(0).max(100).optional(),
    parent_id: z.string().optional(),
    dependency_ids: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    estimate_hours: z.number().optional(),
    order_index: z.number().optional(),
  }))
});

export type ExportPlanInput = z.infer<typeof exportPlanSchema>;
export type ImportPlanInput = z.infer<typeof importPlanSchema>;

