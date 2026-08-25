"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function InviteSessionBridge() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let refreshed = false;
    const refreshForSession = (hasSession: boolean) => {
      if (!hasSession || refreshed) return;
      refreshed = true;
      router.refresh();
    };
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => refreshForSession(Boolean(session)),
    );
    void supabase.auth
      .getSession()
      .then(({ data }) => refreshForSession(Boolean(data.session)));
    return () => listener.subscription.unsubscribe();
  }, [router]);

  return null;
}
