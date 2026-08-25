import { CaptureProcess } from "@/components/app/capture-process";
import { PageHeading } from "@/components/app/page-heading";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function NewProcessPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name")
    .eq("organization_id", context.organization.id)
    .order("name");
  return (
    <>
      <PageHeading
        eyebrow="Capture process"
        title="Don't write a manual. Just do your job."
        description="Upload a recording or explain the work naturally. Opryn will prepare a structured process for you to review before your team sees it."
      />
      <CaptureProcess roles={roles ?? []} />
    </>
  );
}
