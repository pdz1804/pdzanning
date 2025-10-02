import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    unique: true, 
    index: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  password_hash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  avatar: { type: String } // color/emoji
}, { 
  timestamps: { 
    createdAt: "created_at", 
    updatedAt: "updated_at" 
  } 
});

export default model<IUser>("User", UserSchema);

