"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setLoading(true);
    const response = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setLoading(false);
      return;
    }
    router.replace("/app");
    router.refresh();
  }
  return (
    <>
      <button
        disabled={loading}
        onClick={() => void accept()}
        className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3158d8] text-sm font-semibold text-white"
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}Join
        Workspace
        <ArrowRight className="size-4" />
      </button>
      {error ? (
        <p className="mt-3 rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]">
          {error}
        </p>
      ) : null}
    </>
  );
}
