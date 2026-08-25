import { AskOpryn } from "@/components/app/ask-opryn";
import { PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function AskPage() {
  const context = await requireAppContext();
  const supabase = await createClient();
  const [{ count }, { data: processes }] = await Promise.all([
    supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organization.id)
      .eq("approved", true),
    supabase
      .from("processes")
      .select("id,title")
      .eq("organization_id", context.organization.id)
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);
  return (
    <>
      <PageHeading
        title="Ask Opryn"
        description="Ask anything about how your company works."
      />
      <AskOpryn hasKnowledge={Boolean(count)} processes={processes ?? []} />
    </>
  );
}
