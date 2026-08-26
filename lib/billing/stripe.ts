import "server-only";

import Stripe from "stripe";
import type { BillingInterval, PlanId } from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Stripe billing is not configured.");
  stripeClient ??= new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
  return stripeClient;
}

export function getStripePriceId(plan: PlanId, interval: BillingInterval) {
  const key = `STRIPE_${plan.toUpperCase()}_${interval === "year" ? "ANNUAL" : "MONTHLY"}_PRICE_ID`;
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${plan} ${interval} billing is not configured.`);
  return value;
}

export function planFromStripePrice(priceId: string | null | undefined): {
  plan: PlanId;
  interval: BillingInterval;
} | null {
  if (!priceId) return null;
  const mappings: Array<{
    id: string | undefined;
    plan: PlanId;
    interval: BillingInterval;
  }> = [
    {
      id: process.env.STRIPE_CORE_MONTHLY_PRICE_ID,
      plan: "core",
      interval: "month",
    },
    {
      id: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      plan: "premium",
      interval: "month",
    },
    {
      id: process.env.STRIPE_CORE_ANNUAL_PRICE_ID,
      plan: "core",
      interval: "year",
    },
    {
      id: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
      plan: "premium",
      interval: "year",
    },
  ];
  const match = mappings.find((item) => item.id?.trim() === priceId);
  return match ? { plan: match.plan, interval: match.interval } : null;
}

export function annualBillingConfigured() {
  return Boolean(
    process.env.STRIPE_CORE_ANNUAL_PRICE_ID?.trim() &&
    process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID?.trim(),
  );
}

export function billingConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
    process.env.STRIPE_CORE_MONTHLY_PRICE_ID?.trim() &&
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID?.trim(),
  );
}

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;
  return "http://localhost:3000";
}
