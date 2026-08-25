import Link from "next/link";
import { Users } from "lucide-react";
import { InviteAccept } from "@/components/invite-accept";
import { InviteSessionBridge } from "@/components/invite-session-bridge";
import { createClient } from "@/lib/supabase/server";
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const next = `/invite/${encodeURIComponent(token)}`;
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] p-4">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe5ed] bg-white p-7 text-center shadow-xl">
        <InviteSessionBridge />
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
          <Users className="size-5" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.1em] text-[#3158d8]">
          Opryn invitation
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.03em]">
          Join your company workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6b778a]">
          Accept the invitation to view your assigned processes, complete
          training, and ask Opryn company questions.
        </p>
        {data.user ? (
          <InviteAccept token={token} />
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="mt-7 flex min-h-12 items-center justify-center rounded-xl bg-[#3158d8] text-sm font-semibold text-white"
          >
            Sign in to continue
          </Link>
        )}
      </section>
    </main>
  );
}
