"use client";

import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  LoaderCircle,
  Target,
} from "lucide-react";

const steps = [
  "Your business",
  "How work gets done",
  "What you want to hand off",
];

export function OnboardingForm({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    employeeCount: "",
    ownerRole: "Owner",
    businessDescription: "",
    repeatedWork: "",
    hardestToHandoff: "",
    commonQuestions: "",
    ownerGoal: "",
  });

  function next() {
    setError("");
    if (
      step === 0 &&
      (!form.name.trim() ||
        !form.industry.trim() ||
        form.employeeCount === "" ||
        !form.ownerRole.trim())
    ) {
      setError("Complete the business details before continuing.");
      return;
    }
    if (
      step === 1 &&
      (!form.businessDescription.trim() || !form.repeatedWork.trim())
    ) {
      setError("Tell Opryn what the business does and what work repeats.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.hardestToHandoff.trim()) {
      setError("Tell Opryn what is hardest to hand off.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to create your workspace.");
      setReady(true);
      window.setTimeout(() => {
        window.location.replace("/app/getting-started");
      }, 900);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create your workspace.",
      );
      setLoading(false);
    }
  }

  if (loading) return <OnboardingTransition ready={ready} />;

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-7 flex items-center justify-center gap-2 text-xl font-semibold tracking-[-.04em]">
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#3158d8] text-sm font-bold text-white">
            O
          </span>
          Opryn
        </div>
        <section className="overflow-hidden rounded-[24px] border border-[#dfe5ed] bg-white shadow-[0_24px_70px_rgba(24,39,75,.08)]">
          <div className="border-b border-[#e8ecf1] bg-[#fbfcfe] px-6 py-5 sm:px-9">
            <div className="flex items-center justify-between text-xs font-semibold text-[#718095]">
              <span>Getting started</span>
              <span>
                Step {step + 1} of {steps.length}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {steps.map((label, index) => (
                <div key={label}>
                  <div
                    className={`h-1.5 rounded-full ${index <= step ? "bg-[#3158d8]" : "bg-[#e5e9ef]"}`}
                  />
                  <span
                    className={`mt-2 hidden text-[11px] sm:block ${index === step ? "font-semibold text-[#3158d8]" : "text-[#8a95a5]"}`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="p-6 sm:p-10">
            {step === 0 ? (
              <div>
                <StepIcon icon={<Building2 className="size-5" />} />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
                  Welcome, {firstName}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
                  Tell us about your business.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#687487]">
                  Opryn uses this to organize your private workspace and tailor
                  the processes it recommends first.
                </p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
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
                    onChange={(employeeCount) =>
                      setForm({ ...form, employeeCount })
                    }
                    type="number"
                  />
                  <Field
                    label="Your role"
                    placeholder="Owner"
                    value={form.ownerRole}
                    onChange={(ownerRole) => setForm({ ...form, ownerRole })}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <StepIcon icon={<ClipboardCheck className="size-5" />} />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
                  Help Opryn understand the work
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
                  What does a normal week look like?
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#687487]">
                  Short, natural answers are enough. You are not documenting
                  processes yet.
                </p>
                <div className="mt-8 space-y-5">
                  <TextArea
                    label="What does your business do for customers?"
                    hint="Include your main services or the type of work your team delivers."
                    placeholder="We install and repair plumbing systems for homeowners and small commercial properties…"
                    value={form.businessDescription}
                    onChange={(businessDescription) =>
                      setForm({ ...form, businessDescription })
                    }
                  />
                  <TextArea
                    label="What work happens over and over?"
                    hint="Think about daily or weekly work someone else could eventually handle."
                    placeholder="Answering new customer calls, preparing estimates, scheduling technicians, ordering parts…"
                    value={form.repeatedWork}
                    onChange={(repeatedWork) =>
                      setForm({ ...form, repeatedWork })
                    }
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <StepIcon icon={<Target className="size-5" />} />
                <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
                  Your delegation goal
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
                  Where do you need help first?
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#687487]">
                  Opryn will turn these answers into a starting plan—not a
                  generic list of SOPs.
                </p>
                <div className="mt-8 space-y-5">
                  <TextArea
                    label="What is hardest for you to hand off?"
                    hint="What do you keep doing because it feels easier than teaching someone?"
                    placeholder="Preparing accurate estimates because pricing decisions still depend on me…"
                    value={form.hardestToHandoff}
                    onChange={(hardestToHandoff) =>
                      setForm({ ...form, hardestToHandoff })
                    }
                  />
                  <TextArea
                    label="What questions keep coming back to you? (optional)"
                    placeholder="Can we offer this discount? Which vendor should I use? What do I do with an overdue invoice?"
                    value={form.commonQuestions}
                    onChange={(commonQuestions) =>
                      setForm({ ...form, commonQuestions })
                    }
                  />
                  <TextArea
                    label="What would success look like? (optional)"
                    placeholder="I want the office to run for a week without calling me for routine decisions."
                    value={form.ownerGoal}
                    onChange={(ownerGoal) => setForm({ ...form, ownerGoal })}
                    rows={3}
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-6 rounded-xl bg-[#fff0f1] px-3 py-2 text-sm text-[#a83f49]"
              >
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#edf0f4] pt-6">
              {step ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setError("");
                    setStep((current) => current - 1);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#5e6b7e] hover:bg-[#f3f5f8]"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
              ) : (
                <span />
              )}
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8]"
                >
                  Continue <ArrowRight className="size-4" />
                </button>
              ) : (
                <button
                  disabled={loading}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8] disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  {loading ? "Building your plan…" : "Build My Starting Plan"}
                  {!loading ? <ArrowRight className="size-4" /> : null}
                </button>
              )}
            </div>
          </form>
        </section>
        <p className="mt-5 text-center text-xs text-[#7b8798]">
          Your answers stay inside your private company workspace.
        </p>
      </div>
    </main>
  );
}

function OnboardingTransition({ ready }: { ready: boolean }) {
  const stages = [
    "Creating your private workspace",
    "Learning what matters in your business",
    "Choosing the first processes to capture",
  ];
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-4 py-10">
      <section
        aria-live="polite"
        className="w-full max-w-[560px] rounded-[24px] border border-[#dfe5ed] bg-white p-7 text-center shadow-[0_24px_70px_rgba(24,39,75,.08)] sm:p-10"
      >
        <div className="relative mx-auto grid size-20 place-items-center">
          {!ready ? (
            <span className="absolute inset-0 animate-ping rounded-full bg-[#dfe7ff] opacity-70" />
          ) : null}
          <span
            className={`relative grid size-16 place-items-center rounded-full ${ready ? "bg-[#eaf7f1] text-[#177257]" : "bg-[#edf2ff] text-[#3158d8]"}`}
          >
            {ready ? (
              <Check className="size-7" strokeWidth={2.5} />
            ) : (
              <LoaderCircle className="size-7 animate-spin" />
            )}
          </span>
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[#3158d8]">
          {ready ? "Ready to begin" : "Setting up Opryn"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          {ready
            ? "Your starting plan is ready."
            : "Building your starting plan…"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#687487]">
          {ready
            ? "Taking you to the work Opryn recommends teaching first."
            : "Opryn is turning your answers into a practical plan for delegating your first pieces of work."}
        </p>
        <div className="mt-7 space-y-2 text-left">
          {stages.map((label, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[#e4e9f0] bg-[#fafbfd] px-4 py-3 text-sm text-[#53627a]"
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${ready ? "bg-[#eaf7f1] text-[#177257]" : index === 0 ? "bg-[#edf2ff] text-[#3158d8]" : "bg-[#f0f2f5] text-[#8b95a4]"}`}
              >
                {ready ? "✓" : index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StepIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="grid size-11 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
      {icon}
    </div>
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

function TextArea({
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
    <label className="block text-sm font-medium text-[#354157]">
      {label}
      {hint ? (
        <span className="mt-1 block text-xs font-normal leading-5 text-[#7b8798]">
          {hint}
        </span>
      ) : null}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full resize-y rounded-xl border border-[#d9e0e9] p-3.5 text-sm leading-6 outline-none transition placeholder:text-[#a8b0bc] focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
      />
    </label>
  );
}
