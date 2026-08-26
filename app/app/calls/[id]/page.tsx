import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CallReview } from "@/components/app/call-review";
import { PageHeading } from "@/components/app/page-heading";
import { requireAdminContext } from "@/lib/app-context";
import { requireFeature } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function CallReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { id } = await params;
  const org = context.organization.id;
  await requireFeature(supabase, org, "callLearning");
  const [{ data: call }, { data: findings }] = await Promise.all([
    supabase
      .from("call_recordings")
      .select("id,title,call_type,status,created_at")
      .eq("id", id)
      .eq("organization_id", org)
      .maybeSingle(),
    supabase
      .from("call_findings")
      .select("id,finding_type,title,content,evidence,confidence,status")
      .eq("call_id", id)
      .eq("organization_id", org)
      .order("created_at"),
  ]);
  if (!call) notFound();
  return (
    <>
      <Link
        href="/app/calls"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#687487] hover:text-[#3158d8]"
      >
        <ArrowLeft className="size-4" />
        Back to calls
      </Link>
      <PageHeading
        eyebrow={`${call.call_type} call · ${new Date(call.created_at).toLocaleDateString()}`}
        title="Opryn learned from this call"
        description={call.title}
      />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#dce6e1] bg-[#f3faf7] p-4 text-sm leading-6 text-[#46665b]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#2b9a76]" />
        <p>
          <strong>Review required.</strong> Observed and unknown findings are
          not official company knowledge. Only items you approve can be used by
          Ask Opryn.
        </p>
      </div>
      <CallReview callId={call.id} initialFindings={findings ?? []} />
    </>
  );
}
