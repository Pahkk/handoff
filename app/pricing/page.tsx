import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth";
import { EarlyAccessProvider } from "@/components/early-access";
import { Footer, Navbar } from "@/components/navigation";
import { PricingPage } from "@/components/pricing-page";
import { getOptionalAppContext } from "@/lib/app-context";
import {
  annualBillingConfigured,
  billingConfigured,
} from "@/lib/billing/stripe";

export const metadata: Metadata = {
  title: "Pricing — Opryn Core and Premium",
  description:
    "Choose Opryn Core for company knowledge and employee answers, or Premium for video and call learning.",
};

export default async function PublicPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const context = await getOptionalAppContext();
  const requested = (await searchParams).checkout;
  return (
    <AuthProvider>
      <EarlyAccessProvider>
        <Navbar />
        <PricingPage
          signedIn={Boolean(context)}
          canManage={Boolean(context?.isAdmin)}
          annualEnabled={annualBillingConfigured()}
          billingReady={billingConfigured()}
          initialCheckout={
            requested === "core" || requested === "premium"
              ? requested
              : undefined
          }
        />
        <Footer />
      </EarlyAccessProvider>
    </AuthProvider>
  );
}
