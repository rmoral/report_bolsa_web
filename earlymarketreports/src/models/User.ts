import { Schema, model, models } from "mongoose";

export type SubscriptionPlan = "lite" | "pro";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  plan: SubscriptionPlan;
  isActive: boolean;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ["lite", "pro"], default: "lite" },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", userSchema);


