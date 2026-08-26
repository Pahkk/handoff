import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasFeature,
  type BillingInterval,
  type PlanFeature,
  type PlanId,
} from "@/lib/billing/plans";

export type OrganizationPlan = {
  plan: PlanId;
  subscribedPlan: PlanId;
  status: string;
  billingInterval: BillingInterval;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialUsed: boolean;
};

const premiumAccessStatuses = new Set(["active", "trialing"]);

export async function getOrganizationPlan(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrganizationPlan> {
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      "plan,status,billing_interval,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id,trial_used",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  const subscribedPlan: PlanId = data?.plan === "premium" ? "premium" : "core";
  const status = data?.status ?? "active";
  return {
    plan:
      subscribedPlan === "premium" && premiumAccessStatuses.has(status)
        ? "premium"
        : "core",
    subscribedPlan,
    status,
    billingInterval: data?.billing_interval === "year" ? "year" : "month",
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    stripeCustomerId: data?.stripe_customer_id ?? null,
    stripeSubscriptionId: data?.stripe_subscription_id ?? null,
    trialUsed: data?.trial_used ?? false,
  };
}

export class FeatureUnavailableError extends Error {
  readonly feature: PlanFeature;

  constructor(feature: PlanFeature) {
    super("This capability requires Opryn Premium.");
    this.name = "FeatureUnavailableError";
    this.feature = feature;
  }
}

export async function requireFeature(
  supabase: SupabaseClient,
  organizationId: string,
  feature: PlanFeature,
) {
  const subscription = await getOrganizationPlan(supabase, organizationId);
  if (!hasFeature(subscription.plan, feature))
    throw new FeatureUnavailableError(feature);
  return subscription;
}
