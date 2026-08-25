import { AskOpryn } from "@/components/app/ask-opryn";
import { PageHeading } from "@/components/app/page-heading";
import { requireAppContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function AskPage() {
  const context = await requireAppContext();
  const supabase = await createClient();
  const { count } = await supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", context.organization.id)
    .eq("approved", true);
  return (
    <>
      <PageHeading
        title="Ask Opryn"
        description="Ask anything about how your company works."
      />
      <AskOpryn hasKnowledge={Boolean(count)} />
    </>
  );
}
