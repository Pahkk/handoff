import { PageHeading } from "@/components/app/page-heading";
import {
  CallPrivacy,
  CallRow,
  CallsLocked,
  CallUploader,
} from "@/components/app/calls-workspace";
import { requireAdminContext } from "@/lib/app-context";
import { getOrganizationPlan } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export default async function CallsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const org = context.organization.id;
  const subscription = await getOrganizationPlan(supabase, org);
  if (!hasFeature(subscription.plan, "callLearning"))
    return (
      <>
        <PageHeading
          eyebrow="Premium learning"
          title="Calls"
          description="Turn real conversations into reusable business knowledge."
        />
        <CallsLocked />
      </>
    );
  const [{ data: acknowledgment }, { data: calls }, { data: findings }] =
    await Promise.all([
      supabase
        .from("call_privacy_acknowledgments")
        .select("id")
        .eq("organization_id", org)
        .eq("acknowledged_by", context.user.id)
        .maybeSingle(),
      supabase
        .from("call_recordings")
        .select("id,title,call_type,status,created_at")
        .eq("organization_id", org)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("call_findings")
        .select("finding_type,title,status")
        .eq("organization_id", org)
        .neq("status", "ignored"),
    ]);
  const common = new Map<string, number>();
  for (const item of findings ?? [])
    if (
      item.finding_type === "customer_question" ||
      item.finding_type === "sales_objection"
    )
      common.set(item.title, (common.get(item.title) ?? 0) + 1);
  const repeated = [...common.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <>
      <PageHeading
        eyebrow="Premium learning"
        title="Calls"
        description="Turn real conversations into reusable business knowledge."
      />
      <CallPrivacy acknowledged={Boolean(acknowledgment)} />
      <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
        <CallUploader organizationId={org} />
        <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <h2 className="font-semibold">This workspace</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric
              label="Calls analyzed"
              value={
                (calls ?? []).filter(
                  (call) =>
                    call.status === "needs_review" ||
                    call.status === "approved",
                ).length
              }
            />
            <Metric
              label="Approved findings"
              value={
                (findings ?? []).filter((item) => item.status === "approved")
                  .length
              }
            />
          </div>
          <h3 className="mt-6 text-sm font-semibold">
            Recurring call insights
          </h3>
          {repeated.length ? (
            <div className="mt-3 space-y-2">
              {repeated.map(([title, count]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-xl bg-[#f7f9fc] p-3 text-sm"
                >
                  <span className="truncate pr-3">{title}</span>
                  <strong>{count}×</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#718095]">
              Patterns will appear after Opryn analyzes more calls.
            </p>
          )}
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent calls</h2>
          <span className="text-xs text-[#7a8798]">Uploaded recordings</span>
        </div>
        {calls?.length ? (
          <div className="mt-3">
            {calls.map((call) => (
              <CallRow key={call.id} call={call} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-[#f7f9fc] p-5 text-sm text-[#718095]">
            No calls analyzed yet. Your phone, Zoom, and meeting integrations
            are not connected automatically.
          </p>
        )}
      </section>
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Connect Phone System", "Connect Zoom", "Connect Google Meet"].map(
          (label) => (
            <div
              key={label}
              className="rounded-2xl border border-[#e2e7ed] bg-[#f9fafc] p-4"
            >
              <p className="text-sm font-semibold text-[#768295]">{label}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#97a1af]">
                Coming soon
              </p>
            </div>
          ),
        )}
      </section>
    </>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f7f9fc] p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[#718095]">{label}</p>
    </div>
  );
}
