import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getRequestContext({
  admin = false,
}: { admin?: boolean } = {}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return {
      error: NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 },
      ),
    } as const;
  const organizationId = await import("next/headers").then(
    async ({ cookies }) => (await cookies()).get("opryn-organization")?.value,
  );
  let query = supabase
    .from("organization_members")
    .select("id, organization_id, permission_level, role_id")
    .eq("user_id", userData.user.id);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data: membership } = await query.limit(1).maybeSingle();
  if (!membership)
    return {
      error: NextResponse.json(
        { error: "Workspace access was not found." },
        { status: 403 },
      ),
    } as const;
  if (admin && !["owner", "admin"].includes(membership.permission_level))
    return {
      error: NextResponse.json(
        { error: "Owner or admin access is required." },
        { status: 403 },
      ),
    } as const;
  return { supabase, user: userData.user, membership } as const;
}

export function apiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  console.error(
    "Opryn API error",
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: "Unknown error" },
  );
  return NextResponse.json(
    {
      error:
        error instanceof Error && error.message.includes("not configured")
          ? error.message
          : fallback,
    },
    { status: 500 },
  );
}
