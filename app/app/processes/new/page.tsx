import { CaptureProcess } from "@/components/app/capture-process";
import { PageHeading } from "@/components/app/page-heading";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function NewProcessPage({
  searchParams,
}: {
  searchParams: Promise<{ recommendation?: string }>;
}) {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { recommendation: recommendationId } = await searchParams;
  const [{ data: roles }, { data: recommendation }] = await Promise.all([
    supabase
      .from("roles")
      .select("id, name")
      .eq("organization_id", context.organization.id)
      .order("name"),
    recommendationId
      ? supabase
          .from("process_recommendations")
          .select("id,title,reason,suggested_prompt")
          .eq("id", recommendationId)
          .eq("organization_id", context.organization.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="Capture process"
        title="Don't write a manual. Just do your job."
        description="Upload a recording or explain the work naturally. Opryn will prepare a structured process for you to review before your team sees it."
      />
      <CaptureProcess
        roles={roles ?? []}
        initial={
          recommendation
            ? {
                title: recommendation.title,
                description: recommendation.reason,
                coachingPrompt: recommendation.suggested_prompt,
                recommendationId: recommendation.id,
              }
            : undefined
        }
      />
    </>
  );
}
