"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
type Props = {
  initial: {
    name: string;
    industry: string;
    employeeCount: number;
    employeesCanAsk: boolean;
    allowEscalations: boolean;
    confidenceThreshold: number;
  };
  isOwner: boolean;
};
export function SettingsForm({ initial, isOwner }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  async function save() {
    setError("");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setMessage("Settings saved.");
    router.refresh();
  }
  async function remove() {
    const response = await fetch("/api/settings", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }
  return (
    <div className="space-y-5">
      <Section
        title="Business"
        note="The basic details shown across your Opryn workspace."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Business name"
            value={data.name}
            onChange={(name) => setData({ ...data, name })}
            className="sm:col-span-2"
          />
          <Field
            label="Industry"
            value={data.industry}
            onChange={(industry) => setData({ ...data, industry })}
          />
          <label className="block text-sm font-medium">
            Business size
            <input
              type="number"
              min="0"
              value={data.employeeCount}
              onChange={(e) =>
                setData({ ...data, employeeCount: Number(e.target.value) })
              }
              className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5"
            />
          </label>
        </div>
      </Section>
      <Section
        title="Opryn Knowledge"
        note="Control how employees get answers and when you are interrupted."
      >
        <Toggle
          label="Employees may ask Opryn"
          note="Allow workspace members to ask questions from approved company knowledge."
          checked={data.employeesCanAsk}
          onChange={(employeesCanAsk) => setData({ ...data, employeesCanAsk })}
        />
        <Toggle
          label="Escalate unanswered questions"
          note="Let employees send unknown questions to owners and admins."
          checked={data.allowEscalations}
          onChange={(allowEscalations) =>
            setData({ ...data, allowEscalations })
          }
        />
        <label className="mt-5 block text-sm font-medium">
          Answer confidence: {Math.round(data.confidenceThreshold * 100)}%
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.01"
            value={data.confidenceThreshold}
            onChange={(e) =>
              setData({ ...data, confidenceThreshold: Number(e.target.value) })
            }
            className="mt-3 w-full accent-[#3158d8]"
          />
          <span className="mt-1 block text-xs font-normal text-[#7b8798]">
            Higher confidence means Opryn will ask the owner more often instead
            of risking an incomplete answer.
          </span>
        </label>
      </Section>
      {error ? (
        <p className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="flex items-center gap-2 rounded-xl bg-[#eaf7f1] p-3 text-sm text-[#177257]">
          <Check className="size-4" />
          {message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          onClick={() => void save()}
          className="min-h-11 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white"
        >
          Save Settings
        </button>
      </div>
      {isOwner ? (
        <Section
          title="Danger Zone"
          note="Deleting a workspace permanently removes its processes, rules, questions, and training."
        >
          <button
            onClick={() => setConfirming(!confirming)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e3bdc1] px-4 text-sm font-semibold text-[#a13e47]"
          >
            <Trash2 className="size-4" />
            Delete workspace
          </button>
          {confirming ? (
            <div className="mt-4 rounded-xl bg-[#fff4f5] p-4">
              <p className="text-sm text-[#783e44]">
                Type <strong>{data.name}</strong> to confirm.
              </p>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="mt-3 h-10 w-full rounded-lg border border-[#e0bdc0] px-3 text-sm"
              />
              <button
                disabled={confirmation !== data.name}
                onClick={() => void remove()}
                className="mt-3 min-h-10 rounded-lg bg-[#a9434c] px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Permanently delete
              </button>
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#718095]">{note}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5"
      />
    </label>
  );
}
function Toggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 border-b border-[#edf0f4] py-4 first:pt-0">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[#7b8798]">
          {note}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 accent-[#3158d8]"
      />
    </label>
  );
}
