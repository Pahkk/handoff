import { PageHeading } from "@/components/app/page-heading";
import { SettingsForm } from "@/components/app/settings-form";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function SettingsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("organization_settings")
    .select("employees_can_ask,allow_escalations,confidence_threshold")
    .eq("organization_id", context.organization.id)
    .single();
  return (
    <>
      <PageHeading
        title="Settings"
        description="Manage your business and how Opryn handles company questions."
      />
      <div className="mx-auto max-w-3xl">
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
