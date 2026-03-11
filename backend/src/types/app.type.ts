import type { UserRole } from "../models/user.model.js";
import type { PlanType } from "../utils/plan.limits.js";

export type AppVariables = {
  userId: string;
  tenantId: string;
  userRole: UserRole;
  plan: PlanType;
};

export type AppEnv = {
  Variables: AppVariables;
};