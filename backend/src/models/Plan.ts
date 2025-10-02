import { Schema, model, Document, Types } from "mongoose";

export interface IPlanMember {
  user_id: Types.ObjectId;
  role: "owner" | "editor" | "viewer";
  joined_at: Date;
}

export interface IPlan extends Document {
  _id: string;
  name: string;
  description?: string;
  owner_id: Types.ObjectId;
  members: IPlanMember[];
  created_at: Date;
  updated_at: Date;
}

const PlanMemberSchema = new Schema<IPlanMember>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["owner", "editor", "viewer"], 
    required: true,
    default: "viewer"
  },
  joined_at: { 
    type: Date, 
    default: Date.now 
  }
});

const PlanSchema = new Schema<IPlan>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  owner_id: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  members: [PlanMemberSchema]
}, { 
  timestamps: { 
    createdAt: "created_at", 
    updatedAt: "updated_at" 
  } 
});

// Indexes for efficient queries
PlanSchema.index({ owner_id: 1 });
PlanSchema.index({ "members.user_id": 1 });
PlanSchema.index({ "members.role": 1 });

// Virtual for getting all user IDs in this plan
PlanSchema.virtual('user_ids').get(function() {
  const userIds = [this.owner_id];
  this.members.forEach(member => userIds.push(member.user_id));
  return userIds;
});

export default model<IPlan>("Plan", PlanSchema);
