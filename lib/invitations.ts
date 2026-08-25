import "server-only";

import { createClient } from "@supabase/supabase-js";

export async function deliverWorkspaceInvite(input: {
  email: string;
  inviteUrl: string;
}) {
  const auth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const { error } = await auth.auth.signInWithOtp({
    email: input.email,
    options: {
      emailRedirectTo: input.inviteUrl,
      shouldCreateUser: true,
    },
  });
  if (error) {
    console.error("Unable to deliver workspace invitation", {
      name: error.name,
      status: error.status,
      code: error.code,
    });
    return { delivered: false as const };
  }
  return { delivered: true as const };
}
