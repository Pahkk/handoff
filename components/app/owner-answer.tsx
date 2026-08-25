"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { showAppToast } from "@/lib/client-toast";
export function OwnerAnswer({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [suggestion, setSuggestion] = useState<{
    answerId: string;
    title: string;
    rule: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function prepare() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/questions/${questionId}/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "Unable to save answer.");
      return;
    }
    setSuggestion(body);
  }
  async function resolve(action: "approve" | "answer_only") {
    if (!suggestion) return;
    setLoading(true);
    const response = await fetch(`/api/questions/${questionId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...suggestion, action }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "Unable to finish.");
      return;
    }
    showAppToast(
      action === "approve" ? "Company rule approved!" : "Answer sent!",
      action === "approve"
        ? "Opryn can use it the next time this question comes up."
        : "The employee question has been resolved.",
    );
    router.refresh();
  }
  return (
    <div className="mt-4 border-t border-[#e8ecf1] pt-4">
      {!suggestion ? (
        <>
          <label className="block text-xs font-semibold text-[#657286]">
            Your answer
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Answer the way you would explain it to an employee…"
              rows={3}
              className="mt-2 w-full rounded-xl border border-[#d8e0e9] p-3 text-sm leading-5 outline-none focus:border-[#7190ee]"
            />
          </label>
          {error ? (
            <p className="mt-2 text-xs text-[#a83f49]">{error}</p>
          ) : null}
          <button
            disabled={!answer.trim() || loading}
            onClick={() => void prepare()}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#3158d8] px-4 text-xs font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : null}
            Answer
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-[#cdd9fa] bg-[#f5f7ff] p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.1em] text-[#3158d8]">
            <CheckCircle2 className="size-4" />
            New company knowledge detected
          </p>
          <input
            value={suggestion.title}
            onChange={(event) =>
              setSuggestion({ ...suggestion, title: event.target.value })
            }
            className="mt-3 h-9 w-full rounded-lg border border-[#d4dce8] px-3 text-sm font-semibold"
          />
          <textarea
            value={suggestion.rule}
            onChange={(event) =>
              setSuggestion({ ...suggestion, rule: event.target.value })
            }
            rows={3}
            className="mt-2 w-full rounded-lg border border-[#d4dce8] p-3 text-sm leading-5"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={loading}
              onClick={() => void resolve("approve")}
              className="rounded-lg bg-[#3158d8] px-3.5 py-2 text-xs font-semibold text-white"
            >
              Approve as Company Rule
            </button>
            <button
              disabled={loading}
              onClick={() => void resolve("answer_only")}
              className="rounded-lg border border-[#cbd4e0] bg-white px-3.5 py-2 text-xs font-semibold"
            >
              Answer Only
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-[#a83f49]">{error}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
