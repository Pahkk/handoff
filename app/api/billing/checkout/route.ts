import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getRequestContext } from "@/lib/api";
import { isPlanId } from "@/lib/billing/plans";
import { getOrganizationPlan } from "@/lib/billing/subscription";
import { getAppUrl, getStripe, getStripePriceId } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  plan: z.string().refine(isPlanId),
  interval: z.enum(["month", "year"]).default("month"),
});

export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a valid Opryn plan." },
      { status: 400 },
    );
  const { supabase, user, membership } = context;
  const organizationId = membership.organization_id;
  try {
    const subscription = await getOrganizationPlan(supabase, organizationId);
    if (
      subscription.subscribedPlan === parsed.data.plan &&
      ["active", "trialing"].includes(subscription.status) &&
      subscription.stripeCustomerId
    )
      return NextResponse.json(
        { error: "This plan is already active. Manage it from Billing." },
        { status: 409 },
      );

    const stripe = getStripe();
    const service = createServiceClient();
    if (subscription.stripeCustomerId && subscription.stripeSubscriptionId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${getAppUrl()}/app/settings`,
      });
      return NextResponse.json({ url: portal.url, destination: "portal" });
    }
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { organization_id: organizationId },
      });
      customerId = customer.id;
      const { error } = await service
        .from("organization_subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("organization_id", organizationId);
      if (error) throw error;
    }
    const appUrl = getAppUrl();
    const trialEligible =
      parsed.data.plan === "premium" && !subscription.trialUsed;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: organizationId,
      line_items: [
        {
          price: getStripePriceId(parsed.data.plan, parsed.data.interval),
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/app/settings?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=canceled`,
      metadata: {
        organization_id: organizationId,
        plan: parsed.data.plan,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          plan: parsed.data.plan,
        },
        ...(trialEligible ? { trial_period_days: 14 } : {}),
      },
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    return apiError(error, "Opryn couldn't start checkout. Please try again.");
  }
}
