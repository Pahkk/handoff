"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { showAppToast } from "@/lib/client-toast";

export function BusinessDiscoveryForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    businessDescription: "",
    repeatedWork: "",
    hardestToHandoff: "",
    commonQuestions: "",
    ownerGoal: "",
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to build your starting plan.");
      showAppToast(
        "Starting plan created!",
        "Opryn recommended the first processes to teach.",
      );
      router.replace("/app/getting-started");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to build your starting plan.",
      );
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
      <Question
        label="What does your business do for customers?"
        hint="Include your main services or the kind of work your team delivers."
        value={form.businessDescription}
        onChange={(businessDescription) =>
          setForm({ ...form, businessDescription })
        }
        placeholder="We help customers by…"
      />
      <Question
        label="What work happens over and over?"
        hint="Think about daily or weekly tasks someone else could eventually handle."
        value={form.repeatedWork}
        onChange={(repeatedWork) => setForm({ ...form, repeatedWork })}
        placeholder="Every week we…"
      />
      <Question
        label="What is hardest for you to hand off?"
        hint="What do you keep doing because teaching it feels harder?"
        value={form.hardestToHandoff}
        onChange={(hardestToHandoff) => setForm({ ...form, hardestToHandoff })}
        placeholder="The business still depends on me for…"
      />
      <Question
        label="What questions keep coming back to you? (optional)"
        value={form.commonQuestions}
        onChange={(commonQuestions) => setForm({ ...form, commonQuestions })}
        placeholder="My team often asks…"
        rows={3}
      />
      <Question
        label="What would success look like? (optional)"
        value={form.ownerGoal}
        onChange={(ownerGoal) => setForm({ ...form, ownerGoal })}
        placeholder="I want the business to…"
        rows={3}
      />
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          disabled={loading}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {loading ? "Building your plan…" : "Build My Starting Plan"}
          {!loading ? <ArrowRight className="size-4" /> : null}
        </button>
      </div>
    </form>
  );
}

function Question({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="block rounded-2xl border border-[#dfe5ed] bg-white p-5 text-sm font-semibold text-[#354157] sm:p-6">
      {label}
      {hint ? (
        <span className="mt-1 block text-xs font-normal leading-5 text-[#7b8798]">
          {hint}
        </span>
      ) : null}
      <textarea
        required={!label.includes("optional")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-3 w-full resize-y rounded-xl border border-[#d9e0e9] p-3.5 text-sm font-normal leading-6 outline-none placeholder:text-[#a8b0bc] focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
      />
    </label>
  );
}
