import type { UserRole } from "../models/user.model";
import type { PlanType } from "../utils/plan.limits";

export type AppVariables = {
  userId: string;
  tenantId: string;
  userRole: UserRole;
  plan: PlanType;
};

export type AppEnv = {
  Variables: AppVariables;
};