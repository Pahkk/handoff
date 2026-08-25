import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  industry: z.string().trim().min(1).max(100),
  employeeCount: z.coerce.number().int().min(0).max(100000),
  ownerRole: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please complete every workspace field." },
      { status: 400 },
    );
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return NextResponse.json(
      { error: "Please sign in again." },
      { status: 401 },
    );
  const { data, error } = await supabase.rpc("create_organization", {
    business_name: parsed.data.name,
    business_industry: parsed.data.industry,
    business_employee_count: parsed.data.employeeCount,
    owner_job_title: parsed.data.ownerRole,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  const response = NextResponse.json({ organizationId: data });
  response.cookies.set("opryn-organization", String(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
