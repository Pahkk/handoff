import { NextResponse } from "next/server";

const requiredFields = [
  "firstName",
  "email",
  "businessName",
  "industry",
  "employees",
  "hiring",
  "hardestToHandOff",
] as const;

type Submission = Record<(typeof requiredFields)[number], string> & {
  phone?: string;
};

function isSubmission(value: unknown): value is Submission {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return requiredFields.every(
    (field) => typeof candidate[field] === "string" && candidate[field].trim().length > 0,
  );
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.json({ error: "Early access is not configured." }, { status: 503 });
  }

  let submission: unknown;
  try {
    submission = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isSubmission(submission)) {
    return NextResponse.json({ error: "Please complete every required field." }, { status: 400 });
  }

  const response = await fetch(`${url}/rest/v1/early_access_submissions`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      first_name: submission.firstName.trim(),
      work_email: submission.email.trim().toLowerCase(),
      business_name: submission.businessName.trim(),
      industry: submission.industry.trim(),
      employee_count: submission.employees.trim(),
      hiring_timeline: submission.hiring.trim(),
      hardest_to_hand_off: submission.hardestToHandOff.trim(),
      phone: submission.phone?.trim() || null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Supabase early-access insert failed", response.status);
    return NextResponse.json({ error: "We couldn't save your request. Please try again." }, { status: 502 });
  }

  return new NextResponse(null, { status: 204 });
}
