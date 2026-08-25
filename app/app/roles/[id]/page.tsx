import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/page-heading";
import { RoleEditor } from "@/components/app/role-editor";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";
export default async function RolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: role }, { data: processes }, { data: assigned }] =
    await Promise.all([
      supabase
        .from("roles")
        .select("id,name,description,responsibilities")
        .eq("id", id)
        .eq("organization_id", context.organization.id)
        .maybeSingle(),
      supabase
        .from("processes")
        .select("id,title")
        .eq("organization_id", context.organization.id)
        .eq("status", "approved")
        .order("title"),
      supabase
        .from("process_role_assignments")
        .select("process_id")
        .eq("organization_id", context.organization.id)
        .eq("role_id", id),
    ]);
  if (!role) notFound();
  const raw = (role.responsibilities ?? {}) as Record<string, unknown>;
  const responsibilities = {
    every_morning: Array.isArray(raw.every_morning)
      ? (raw.every_morning as string[])
      : [],
    every_customer: Array.isArray(raw.every_customer)
      ? (raw.every_customer as string[])
      : [],
    requires_approval: Array.isArray(raw.requires_approval)
      ? (raw.requires_approval as string[])
      : [],
  };
  return (
    <>
      <PageHeading
        eyebrow="Role Builder"
        title={role.name}
        description="Define the work, approvals, and training this person needs."
      />
      <RoleEditor
        role={{ ...role, responsibilities }}
        processes={processes ?? []}
        assigned={(assigned ?? []).map((item) => item.process_id)}
      />
    </>
  );
}
