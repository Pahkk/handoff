"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

type Step = { id?: string; title: string; description: string };
type Rule = {
  id?: string;
  title: string;
  text: string;
  confidence?: number | null;
};
type Clarification = {
  id: string;
  question: string;
  answer: string;
  suggestedRule: string;
};
type ProcessData = {
  id: string;
  title: string;
  summary: string;
  purpose: string;
  status: string;
  steps: Step[];
  rules: Rule[];
  exceptions: Array<{ text: string }>;
  clarifications: Clarification[];
};

export function ProcessReview({ initial }: { initial: ProcessData }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState<"save" | "approve" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save() {
    setSaving("save");
    setError("");
    const response = await fetch(`/api/processes/${data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    setSaving(null);
    if (!response.ok) {
      setError(body.error ?? "Unable to save.");
      return false;
    }
    setMessage("Draft saved");
    router.refresh();
    return true;
  }
  async function approve() {
    setSaving("approve");
    setError("");
    const saved = await fetch(`/api/processes/${data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const savedBody = await saved.json();
    if (!saved.ok) {
      setError(savedBody.error ?? "Unable to save.");
      setSaving(null);
      return;
    }
    const response = await fetch(`/api/processes/${data.id}/approve`, {
      method: "POST",
    });
    const body = await response.json();
    setSaving(null);
    if (!response.ok) {
      setError(body.error ?? "Unable to approve.");
      return;
    }
    setMessage("Process approved. Your team can now use it in Opryn.");
    setData({ ...data, status: "approved" });
    router.refresh();
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= data.steps.length) return;
    const steps = [...data.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    setData({ ...data, steps });
  }
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
          Opryn learned this process
        </p>
        <label className="mt-4 block text-xs font-semibold text-[#667184]">
          Title
          <input
            value={data.title}
            onChange={(event) =>
              setData({ ...data, title: event.target.value })
            }
            className="mt-2 h-12 w-full rounded-xl border border-[#d9e0e9] px-3.5 text-lg font-semibold outline-none focus:border-[#7190ee]"
          />
        </label>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <TextArea
            label="Summary"
            value={data.summary}
            onChange={(summary) => setData({ ...data, summary })}
          />
          <TextArea
            label="Purpose"
            value={data.purpose}
            onChange={(purpose) => setData({ ...data, purpose })}
          />
        </div>
      </section>
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Steps</h2>
            <p className="mt-1 text-xs text-[#7a8698]">
              Put the work in the order an employee should follow.
            </p>
          </div>
          <button
            onClick={() =>
              setData({
                ...data,
                steps: [...data.steps, { title: "", description: "" }],
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0f3f7] px-3 py-2 text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            Add step
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {data.steps.map((step, index) => (
            <div
              key={step.id ?? `new-${index}`}
              className="grid gap-3 rounded-xl border border-[#e2e7ed] p-4 sm:grid-cols-[34px_1fr_auto]"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-xs font-bold text-[#3158d8]">
                {index + 1}
              </span>
              <div className="space-y-2">
                <input
                  aria-label={`Step ${index + 1} title`}
                  value={step.title}
                  onChange={(event) => {
                    const steps = [...data.steps];
                    steps[index] = { ...step, title: event.target.value };
                    setData({ ...data, steps });
                  }}
                  placeholder="Step title"
                  className="h-9 w-full rounded-lg border border-[#dfe5ed] px-3 text-sm font-semibold outline-none focus:border-[#7190ee]"
                />
                <textarea
                  aria-label={`Step ${index + 1} description`}
                  value={step.description}
                  onChange={(event) => {
                    const steps = [...data.steps];
                    steps[index] = { ...step, description: event.target.value };
                    setData({ ...data, steps });
                  }}
                  placeholder="What should the employee do?"
                  rows={2}
                  className="w-full rounded-lg border border-[#dfe5ed] px-3 py-2 text-sm leading-5 outline-none focus:border-[#7190ee]"
                />
              </div>
              <div className="flex gap-1 sm:flex-col">
                <IconButton label="Move up" onClick={() => move(index, -1)}>
                  <ArrowUp className="size-3.5" />
                </IconButton>
                <IconButton label="Move down" onClick={() => move(index, 1)}>
                  <ArrowDown className="size-3.5" />
                </IconButton>
                <IconButton
                  label="Remove step"
                  onClick={() =>
                    setData({
                      ...data,
                      steps: data.steps.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <EditableList
          title="Company rules"
          items={data.rules}
          add={() =>
            setData({
              ...data,
              rules: [...data.rules, { title: "Company rule", text: "" }],
            })
          }
          render={(rule, index) => (
            <div className="rounded-xl border border-[#e2e7ed] p-4">
              <div className="flex gap-2">
                <input
                  value={rule.title}
                  onChange={(event) => {
                    const rules = [...data.rules];
                    rules[index] = { ...rule, title: event.target.value };
                    setData({ ...data, rules });
                  }}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-[#dfe5ed] px-3 text-sm font-semibold"
                />
                <IconButton
                  label="Remove rule"
                  onClick={() =>
                    setData({
                      ...data,
                      rules: data.rules.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
              <textarea
                value={rule.text}
                onChange={(event) => {
                  const rules = [...data.rules];
                  rules[index] = { ...rule, text: event.target.value };
                  setData({ ...data, rules });
                }}
                rows={3}
                className="mt-2 w-full rounded-lg border border-[#dfe5ed] p-3 text-sm leading-5"
              />
            </div>
          )}
        />
        <EditableList
          title="Exceptions"
          items={data.exceptions}
          add={() =>
            setData({ ...data, exceptions: [...data.exceptions, { text: "" }] })
          }
          render={(item, index) => (
            <div className="flex gap-2 rounded-xl border border-[#e2e7ed] p-4">
              <textarea
                value={item.text}
                onChange={(event) => {
                  const exceptions = [...data.exceptions];
                  exceptions[index] = { text: event.target.value };
                  setData({ ...data, exceptions });
                }}
                rows={3}
                className="min-w-0 flex-1 rounded-lg border border-[#dfe5ed] p-3 text-sm leading-5"
              />
              <IconButton
                label="Remove exception"
                onClick={() =>
                  setData({
                    ...data,
                    exceptions: data.exceptions.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </IconButton>
            </div>
          )}
        />
      </section>
      {data.clarifications.length ? (
        <section className="rounded-2xl border border-[#e7d8ae] bg-[#fffdf7] p-5 sm:p-7">
          <h2 className="font-semibold">
            Opryn has {data.clarifications.length}{" "}
            {data.clarifications.length === 1 ? "question" : "questions"}
          </h2>
          <p className="mt-1 text-xs text-[#806e45]">
            Answer what Opryn could not safely infer. Your answers stay in
            review until approval.
          </p>
          <div className="mt-5 space-y-4">
            {data.clarifications.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#eadfbe] bg-white p-4"
              >
                <p className="text-sm font-semibold">{item.question}</p>
                <textarea
                  value={item.answer}
                  onChange={(event) => {
                    const clarifications = [...data.clarifications];
                    clarifications[index] = {
                      ...item,
                      answer: event.target.value,
                    };
                    setData({ ...data, clarifications });
                  }}
                  placeholder="Answer in your own words…"
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-[#dfe5ed] p-3 text-sm"
                />
                <input
                  value={item.suggestedRule}
                  onChange={(event) => {
                    const clarifications = [...data.clarifications];
                    clarifications[index] = {
                      ...item,
                      suggestedRule: event.target.value,
                    };
                    setData({ ...data, clarifications });
                  }}
                  placeholder="Optional reusable rule"
                  className="mt-2 h-10 w-full rounded-lg border border-[#dfe5ed] px-3 text-sm"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="flex items-center gap-2 rounded-xl bg-[#eaf7f1] p-3 text-sm text-[#177257]">
          <Check className="size-4" />
          {message}
        </p>
      ) : null}
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-[#dfe5ed] bg-white/95 p-3 shadow-[0_12px_40px_rgba(24,39,75,.12)] backdrop-blur">
        <button
          disabled={Boolean(saving)}
          onClick={() => void save()}
          className="min-h-11 rounded-xl border border-[#d5dce6] px-5 text-sm font-semibold disabled:opacity-60"
        >
          {saving === "save" ? "Saving…" : "Save Draft"}
        </button>
        <button
          disabled={Boolean(saving)}
          onClick={() => void approve()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving === "approve" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {saving === "approve"
            ? "Approving…"
            : data.status === "approved"
              ? "Reapprove Process"
              : "Approve Process"}
        </button>
      </div>
    </div>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-[#667184]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-xl border border-[#d9e0e9] p-3.5 text-sm leading-6 outline-none focus:border-[#7190ee]"
      />
    </label>
  );
}
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-lg text-[#748094] hover:bg-[#f0f3f7] hover:text-[#3158d8]"
    >
      {children}
    </button>
  );
}
function EditableList<T>({
  title,
  items,
  add,
  render,
}: {
  title: string;
  items: T[];
  add: () => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button
          type="button"
          onClick={add}
          className="grid size-8 place-items-center rounded-lg bg-[#f0f3f7]"
          aria-label={`Add ${title.toLowerCase()}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map(render)
        ) : (
          <p className="rounded-xl bg-[#f8fafc] p-4 text-sm text-[#7a8698]">
            None captured yet.
          </p>
        )}
      </div>
    </section>
  );
}
