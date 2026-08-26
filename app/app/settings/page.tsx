import { PageHeading } from "@/components/app/page-heading";
import { BillingSettings } from "@/components/app/billing-settings";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAdminContext } from "@/lib/app-context";
import { billingConfigured } from "@/lib/billing/stripe";
import { getOrganizationPlan } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: settings }, subscription, query] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("employees_can_ask,allow_escalations,confidence_threshold")
      .eq("organization_id", context.organization.id)
      .single(),
    getOrganizationPlan(supabase, context.organization.id),
    searchParams,
  ]);
  return (
    <>
      <PageHeading
        title="Settings"
        description="Manage your business and how Opryn handles company questions."
      />
      <div className="mx-auto max-w-3xl space-y-5">
        <BillingSettings
          plan={subscription.plan}
          interval={subscription.billingInterval}
          status={subscription.status}
          periodEnd={subscription.currentPeriodEnd}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          hasStripeCustomer={Boolean(subscription.stripeCustomerId)}
          billingReady={billingConfigured()}
          success={query.billing === "success"}
        />
        <SettingsForm
          initial={{
            name: context.organization.name,
            industry: context.organization.industry,
            employeeCount: context.organization.employeeCount,
            employeesCanAsk: settings?.employees_can_ask ?? true,
            allowEscalations: settings?.allow_escalations ?? true,
            confidenceThreshold: settings?.confidence_threshold ?? 0.72,
          }}
          isOwner={context.membership.permissionLevel === "owner"}
        />
      </div>
    </>
  );
}
