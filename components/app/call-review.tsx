"use client";

import { useState } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";

type Finding = {
  id: string;
  finding_type: string;
  title: string;
  content: string;
  evidence: string;
  confidence: number | null;
  status: string;
};
export function CallReview({
  callId,
  initialFindings,
}: {
  callId: string;
  initialFindings: Finding[];
}) {
  const [findings, setFindings] = useState(initialFindings);
  const [working, setWorking] = useState("");
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  async function act(
    finding: Finding,
    action: "approve" | "ignore",
    title = finding.title,
    content = finding.content,
  ) {
    setWorking(finding.id);
    setError("");
    const response = await fetch(
      `/api/calls/${callId}/findings/${finding.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, title, content }),
      },
    );
    const body = await response.json().catch(() => ({}));
    setWorking("");
    if (!response.ok)
      return setError(body.error ?? "This finding could not be updated.");
    setFindings((current) =>
      current.map((item) =>
        item.id === finding.id
          ? { ...item, title, content, status: body.status }
          : item,
      ),
    );
    setEditing("");
  }
  const visible = findings.filter((item) => item.status !== "ignored");
  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]"
        >
          {error}
        </p>
      ) : null}
      {visible.length ? (
        visible.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            editing={editing === finding.id}
            busy={working === finding.id}
            onEdit={() => setEditing(finding.id)}
            onCancel={() => setEditing("")}
            onAction={(action, title, content) =>
              void act(finding, action, title, content)
            }
          />
        ))
      ) : (
        <div className="rounded-2xl border border-[#dfe5ed] bg-white p-8 text-center">
          <h2 className="font-semibold">Nothing reusable was detected</h2>
          <p className="mt-2 text-sm text-[#718095]">
            Opryn did not find company knowledge worth saving from this call.
          </p>
        </div>
      )}
    </div>
  );
}
function FindingCard({
  finding,
  editing,
  busy,
  onEdit,
  onCancel,
  onAction,
}: {
  finding: Finding;
  editing: boolean;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onAction: (
    action: "approve" | "ignore",
    title?: string,
    content?: string,
  ) => void;
}) {
  const [title, setTitle] = useState(finding.title);
  const [content, setContent] = useState(finding.content);
  const approved = finding.status === "approved";
  return (
    <article className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#3158d8]">
          {finding.finding_type.replaceAll("_", " ")}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${approved ? "bg-[#eaf7f1] text-[#177257]" : finding.status === "unknown" ? "bg-[#f0f2f5] text-[#687487]" : "bg-[#fff4df] text-[#8a6217]"}`}
        >
          {approved
            ? "Approved"
            : finding.status === "unknown"
              ? "Needs clarification"
              : "Observed"}
        </span>
        {finding.confidence !== null ? (
          <span className="ml-auto text-xs text-[#8994a3]">
            {Math.round(finding.confidence * 100)}% confidence
          </span>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-5 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 font-semibold"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[#d9e0e9] p-3.5 text-sm leading-6"
          />
        </div>
      ) : (
        <>
          <h2 className="mt-4 text-lg font-semibold">{finding.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#526174]">
            {finding.content}
          </p>
          {finding.evidence ? (
            <p className="mt-4 rounded-xl bg-[#f7f9fc] p-3 text-xs leading-5 text-[#718095]">
              <strong>Observed evidence:</strong> {finding.evidence}
            </p>
          ) : null}
        </>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#edf0f4] pt-4">
        {editing ? (
          <>
            <button
              disabled={busy}
              onClick={() => onAction("approve", title, content)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2b9a76] px-4 text-sm font-semibold text-white"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Approve edited knowledge
            </button>
            <button
              onClick={onCancel}
              className="min-h-10 rounded-lg border border-[#d9e0e9] px-4 text-sm font-semibold"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              disabled={busy || approved}
              onClick={() => onAction("approve")}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2b9a76] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {approved ? "Approved" : "Approve"}
            </button>
            <button
              onClick={onEdit}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d9e0e9] px-4 text-sm font-semibold"
            >
              <Pencil className="size-4" />
              Edit
            </button>
            <button
              disabled={busy}
              onClick={() => onAction("ignore")}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-[#788497]"
            >
              <X className="size-4" />
              Ignore
            </button>
          </>
        )}
      </div>
    </article>
  );
}
