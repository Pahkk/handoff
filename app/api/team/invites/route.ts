import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/api";
const schema = z.object({
  email: z.string().trim().email().max(320),
  roleId: z.string().uuid().nullable().optional(),
});
export async function POST(request: Request) {
  const context = await getRequestContext({ admin: true });
  if ("error" in context) return context.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid work email." },
      { status: 400 },
    );
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await context.supabase
    .from("organization_invites")
    .insert({
      organization_id: context.membership.organization_id,
      email: parsed.data.email.toLowerCase(),
      role_id: parsed.data.roleId || null,
      permission_level: "employee",
      token_hash: tokenHash,
      invited_by: context.user.id,
      expires_at: expires,
    })
    .select("id,email,expires_at")
    .single();
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "An active invite already exists for this email."
            : "Unable to create the invitation.",
      },
      { status: 400 },
    );
  return NextResponse.json({
    ...data,
    inviteUrl: `${new URL(request.url).origin}/invite/${token}`,
  });
}
