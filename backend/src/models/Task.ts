import { Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  _id: string;
  plan_id: Types.ObjectId; // Reference to Plan
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  assignee_ids?: Types.ObjectId[];
  start_date?: string; // ISO date string (YYYY-MM-DD)
  due_date?: string;   // ISO date string (YYYY-MM-DD)
  progress_pct?: number; // 0-100
  parent_id?: Types.ObjectId;  // subtask parent task id
  dependency_ids?: Types.ObjectId[]; // other task _id references
  tags?: string[];
  estimate_hours?: number;
  order_index?: number; // for manual ordering in columns
  goal?: string;
  notes?: string;
  deliverables?: string;
  created_by: Types.ObjectId;
  updated_by: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TaskSchema = new Schema<ITask>({
  plan_id: { 
    type: Schema.Types.ObjectId, 
    ref: "Plan",
    index: true, 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ["todo", "in_progress", "done"], 
    index: true, 
    required: true,
    default: "todo"
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium",
    index: true
  },
  assignee_ids: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    index: true 
  }],
  start_date: { type: String }, // ISO date (YYYY-MM-DD)
  due_date: { type: String },   // ISO date (YYYY-MM-DD)
  progress_pct: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  parent_id: { 
    type: Schema.Types.ObjectId, 
    ref: "Task", 
    index: true 
  }, // subtask parent
  dependency_ids: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Task" 
  }], // other task _id references
  tags: [{ type: String, index: true }],
  estimate_hours: { type: Number, min: 0 },
  order_index: { type: Number, index: true, default: 0 },
  goal: { type: String }, // Optional goal for the task
  notes: { type: String }, // Optional notes
  deliverables: { type: String }, // Optional deliverables
  created_by: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  updated_by: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, { 
  timestamps: { 
    createdAt: "created_at", 
    updatedAt: "updated_at" 
  } 
});

// Compound indexes for efficient queries
TaskSchema.index({ plan_id: 1, status: 1, order_index: 1 });
TaskSchema.index({ plan_id: 1, assignee_ids: 1 });
TaskSchema.index({ plan_id: 1, due_date: 1 });
TaskSchema.index({ plan_id: 1, parent_id: 1 });
TaskSchema.index({ plan_id: 1, priority: 1 });
TaskSchema.index({ plan_id: 1, tags: 1 });

// Text index for search
TaskSchema.index({ 
  title: "text", 
  description: "text", 
  tags: "text" 
});

export default model<ITask>("Task", TaskSchema);

