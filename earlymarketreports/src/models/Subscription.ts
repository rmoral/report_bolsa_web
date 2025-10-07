import { Schema, model, models } from "mongoose";

export type SubscriptionPlan = "lite" | "pro";
export type SubscriptionStatus = "pending" | "active" | "canceled";

export interface ISubscription {
  name: string;
  email: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    plan: { type: String, enum: ["lite", "pro"], required: true },
    status: { type: String, enum: ["pending", "active", "canceled"], default: "pending" },
    source: { type: String, default: "homepage" },
  },
  { timestamps: true }
);

export const Subscription = models.Subscription || model<ISubscription>("Subscription", subscriptionSchema);


