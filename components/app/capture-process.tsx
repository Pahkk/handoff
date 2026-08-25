"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, Mic2, UploadCloud } from "lucide-react";
import { showAppToast } from "@/lib/client-toast";
import { createClient } from "@/lib/supabase/client";

type Role = { id: string; name: string };
type InitialCapture = {
  title: string;
  description: string;
  coachingPrompt: string;
  recommendationId: string;
};
const mediaStages = [
  "Uploading recording",
  "Transcribing recording",
  "Finding steps and rules",
  "Preparing your process",
];
const textStages = [
  "Reading your explanation",
  "Finding steps and rules",
  "Preparing your process",
];

export function CaptureProcess({
  roles,
  initial,
  returnTo,
}: {
  roles: Role[];
  initial?: InitialCapture;
  returnTo: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"media" | "text">("media");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    roleId: "",
    explanation: "",
  });
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const stages = mode === "media" ? mediaStages : textStages;

  function changeMode(nextMode: "media" | "text") {
    setMode(nextMode);
    setError("");
    if (nextMode === "text") setFile(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setWorking(true);
    setStage(0);
    try {
      if (mode === "media" && !file)
        throw new Error("Choose a recording to upload.");
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          roleId: form.roleId || null,
          inputType: mode,
          recommendationId: initial?.recommendationId ?? null,
          file:
            mode === "media" && file
              ? { name: file.name, type: file.type, size: file.size }
              : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to create process.");
      if (body.ready) {
        setStage(textStages.length - 1);
        showAppToast(
          "Process ready for review!",
          "Check the steps and approve it before your team uses it.",
        );
        router.replace(
          `/app/processes/${body.processId}?returnTo=${encodeURIComponent(returnTo)}`,
        );
        return;
      }
      setStage(0);
      const { error: uploadError } = await createClient()
        .storage.from("process-media")
        .upload(body.storagePath, file!, {
          contentType: file!.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      setStage(1);
      const learn = await fetch(`/api/processes/${body.processId}/learn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId: body.mediaId }),
      });
      const learned = await learn.json();
      if (!learn.ok)
        throw new Error(
          learned.error ?? "Opryn could not learn this recording.",
        );
      setStage(3);
      showAppToast(
        "Process ready for review!",
        "Check the steps and approve it before your team uses it.",
      );
      router.replace(
        `/app/processes/${body.processId}?returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
      setWorking(false);
    }
  }
  if (working)
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#dfe5ed] bg-white p-8 shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
        <h2 className="mt-5 text-center text-xl font-semibold">
          Opryn is learning this process
        </h2>
        <div className="mt-8 space-y-3">
          {stages.map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm ${index <= stage ? "border-[#cdd9fa] bg-[#f5f7ff] text-[#284bbf]" : "border-[#e7ebf0] text-[#9aa3b0]"}`}
            >
              <span
                className={`grid size-6 place-items-center rounded-full text-xs font-bold ${index < stage ? "bg-[#3158d8] text-white" : index === stage ? "border-2 border-[#3158d8]" : "border border-[#d6dce5]"}`}
              >
                {index < stage ? "✓" : index + 1}
              </span>
              {label}
              {index === stage ? (
                <LoaderCircle className="ml-auto size-4 animate-spin" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#7b8798]">
          Keep this page open while Opryn prepares the review.
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Process title"
            value={form.title}
            onChange={(title) => setForm({ ...form, title })}
            placeholder="New Customer Intake"
            className="sm:col-span-2"
          />
          <Field
            label="Description (optional)"
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="What this process covers"
            className="sm:col-span-2"
          />
          <label className="block text-sm font-medium text-[#354157] sm:col-span-2">
            Assign to role (optional)
            <select
              value={form.roleId}
              onChange={(event) =>
                setForm({ ...form, roleId: event.target.value })
              }
              className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] bg-white px-3.5 outline-none focus:border-[#7190ee]"
            >
              <option value="">Everyone</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {initial?.coachingPrompt ? (
        <section className="rounded-2xl border border-[#dce4f2] bg-[#f5f8ff] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.1em] text-[#3158d8]">
            What to show or explain
          </p>
          <p className="mt-2 text-sm leading-6 text-[#53627a]">
            {initial.coachingPrompt}
          </p>
        </section>
      ) : null}
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <h2 className="font-semibold">How do you want to teach Opryn?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ModeButton
            active={mode === "media"}
            onClick={() => changeMode("media")}
            icon={<UploadCloud className="size-5" />}
            title="Upload recording"
            note="Video or audio"
          />
          <ModeButton
            active={mode === "text"}
            onClick={() => changeMode("text")}
            icon={<FileText className="size-5" />}
            title="Explain with text"
            note="Type it naturally"
          />
        </div>
        {mode === "media" ? (
          <div className="mt-5">
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept=".mp4,.mov,.webm,.mp3,.wav,.m4a,audio/*,video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#bcc8d7] bg-[#fafbfd] px-5 text-center hover:border-[#7893e5] hover:bg-[#f7f9ff]"
            >
              <Mic2 className="size-6 text-[#3158d8]" />
              <span className="mt-3 text-sm font-semibold">
                {file ? file.name : "Choose a video or audio recording"}
              </span>
              <span className="mt-1 text-xs text-[#7a8698]">
                MP4, MOV, WEBM, MP3, WAV, or M4A · up to 25 MB
              </span>
              {file ? (
                <span className="mt-2 text-xs font-medium text-[#3158d8]">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Choose another
                </span>
              ) : null}
            </button>
          </div>
        ) : (
          <label className="mt-5 block text-sm font-medium text-[#354157]">
            Explain how you do this
            <textarea
              required
              value={form.explanation}
              onChange={(event) =>
                setForm({ ...form, explanation: event.target.value })
              }
              rows={10}
              placeholder="Start as if you were training someone: First, I open the customer record…"
              className="mt-2 w-full resize-y rounded-xl border border-[#d9e0e9] p-3.5 leading-6 outline-none focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
            />
          </label>
        )}
      </section>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button className="flex min-h-12 items-center gap-2 rounded-xl bg-[#3158d8] px-6 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8]">
          Teach Opryn
        </button>
      </div>
    </form>
  );
}
function ModeButton({
  active,
  onClick,
  icon,
  title,
  note,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${active ? "border-[#7390e8] bg-[#f3f6ff] ring-2 ring-[#3158d8]/10" : "border-[#dfe5ed] hover:bg-[#fafbfd]"}`}
    >
      <span className={active ? "text-[#3158d8]" : "text-[#69758a]"}>
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-[#7a8698]">{note}</span>
    </button>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-[#354157] ${className}`}>
      {label}
      <input
        required={label === "Process title"}
        className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 outline-none placeholder:text-[#a7afbb] focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
