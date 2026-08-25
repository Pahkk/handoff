"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, LoaderCircle } from "lucide-react";

export function OnboardingForm({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    employeeCount: "",
    ownerRole: "Owner",
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to create your workspace.");
      setLoading(false);
      return;
    }
    router.replace("/app");
    router.refresh();
  }
  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-[620px]">
        <div className="mb-8 flex items-center justify-center gap-2 text-xl font-semibold tracking-[-.04em]">
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#3158d8] text-sm font-bold text-white">
            O
          </span>
          Opryn
        </div>
        <section className="rounded-[24px] border border-[#dfe5ed] bg-white p-6 shadow-[0_24px_70px_rgba(24,39,75,.08)] sm:p-10">
          <div className="grid size-11 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
            <Building2 className="size-5" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
            Welcome, {firstName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Create your workspace
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#687487]">
            This keeps your company knowledge private and gives your team one
            place to learn how the business works.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field
              label="Business name"
              placeholder="Johnson Plumbing"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              className="sm:col-span-2"
            />
            <Field
              label="Industry"
              placeholder="Plumbing"
              value={form.industry}
              onChange={(industry) => setForm({ ...form, industry })}
            />
            <Field
              label="Number of employees"
              placeholder="7"
              value={form.employeeCount}
              onChange={(employeeCount) => setForm({ ...form, employeeCount })}
              type="number"
            />
            <Field
              label="Your role"
              placeholder="Owner"
              value={form.ownerRole}
              onChange={(ownerRole) => setForm({ ...form, ownerRole })}
              className="sm:col-span-2"
            />
            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#a83f49] sm:col-span-2"
              >
                {error}
              </p>
            ) : null}
            <button
              disabled={loading}
              className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8] disabled:opacity-60 sm:col-span-2"
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {loading ? "Creating workspace…" : "Create Workspace"}
              {!loading ? <ArrowRight className="size-4" /> : null}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-[#354157] ${className}`}>
      {label}
      <input
        required
        min={type === "number" ? 0 : undefined}
        className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 outline-none transition placeholder:text-[#a8b0bc] focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
