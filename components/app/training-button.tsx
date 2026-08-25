"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
export function TrainingButton({
  processId,
  status,
}: {
  processId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function complete() {
    setLoading(true);
    await fetch(`/api/training/${processId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setLoading(false);
    router.refresh();
  }
  return status === "completed" ? (
    <span className="inline-flex items-center gap-2 rounded-xl bg-[#eaf7f1] px-4 py-3 text-sm font-semibold text-[#177257]">
      <CheckCircle2 className="size-4" />
      Training complete
    </span>
  ) : (
    <button
      disabled={loading}
      onClick={() => void complete()}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Saving…" : "Mark Complete"}
      <CheckCircle2 className="size-4" />
    </button>
  );
}
