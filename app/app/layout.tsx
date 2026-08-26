import { AppShell } from "@/components/app/app-shell";
import { requireAppContext } from "@/lib/app-context";
import { getOrganizationPlan } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opryn Workspace",
  robots: { index: false, follow: false },
};

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAppContext();
  const supabase = await createClient();
  const [{ count }, subscription] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organization.id)
      .eq("user_id", context.user.id)
      .eq("read", false),
    getOrganizationPlan(supabase, context.organization.id),
  ]);
  return (
    <AppShell
      organization={context.organization}
      user={context.user}
      isAdmin={context.isAdmin}
      plan={subscription.plan}
      unreadCount={count ?? 0}
    >
      {children}
    </AppShell>
  );
}
