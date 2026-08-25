import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api";
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
});
export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Add a role name." }, { status: 400 });
  const { data, error } = await context.supabase
    .from("roles")
    .insert({
      organization_id: context.membership.organization_id,
      created_by: context.user.id,
      ...parsed.data,
    })
    .select("id")
    .single();
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "That role already exists."
            : "Unable to create role.",
      },
      { status: 400 },
    );
  return NextResponse.json(data);
}
