"use client";

import { createContext, FormEvent, ReactNode, useContext, useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type ContextValue = { openEarlyAccess: () => void };
const EarlyAccessContext = createContext<ContextValue | null>(null);

export function useEarlyAccess() {
  const value = useContext(EarlyAccessContext);
  if (!value) throw new Error("useEarlyAccess must be used inside EarlyAccessProvider");
  return value;
}

type Submission = Record<string, FormDataEntryValue> & { submittedAt: string };

async function saveSubmission(submission: Submission) {
  const response = await fetch("/api/early-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "We couldn't save your request. Please try again.");
  }

  const key = "opryn-early-access";
  const current = JSON.parse(localStorage.getItem(key) ?? "[]") as Submission[];
  localStorage.setItem(key, JSON.stringify([...current, submission]));
}

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    setSubmitting(true);
    setError("");
    try {
      await saveSubmission({ ...values, submittedAt: new Date().toISOString() });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn't save your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const close = () => { setOpen(false); window.setTimeout(() => setSubmitted(false), 250); };

  return (
    <EarlyAccessContext.Provider value={{ openEarlyAccess: () => setOpen(true) }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#0d1729]/55 p-4 backdrop-blur-[8px]" role="dialog" aria-modal="true" aria-labelledby="early-access-title" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="my-auto w-full max-w-[620px] overflow-hidden rounded-[22px] border border-white/20 bg-white shadow-[0_35px_90px_rgba(8,15,30,.3)]">
            <div className="flex items-start justify-between border-b border-[#e5e9ef] px-6 py-5 sm:px-8">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[.13em] text-[#3158d8]">Early access</div>
                <h2 id="early-access-title" className="text-[27px] font-semibold tracking-[-.04em]">Bring your business out of your head.</h2>
              </div>
              <button type="button" onClick={close} className="grid size-9 shrink-0 place-items-center rounded-full text-[#667184] hover:bg-[#f2f4f7]" aria-label="Close early access form"><X size={19} /></button>
            </div>
            {submitted ? (
              <div className="px-8 py-16 text-center" data-testid="submission-success">
                <CheckCircle2 className="mx-auto mb-5 text-[#1b8b69]" size={42} />
                <h3 className="text-3xl font-semibold tracking-[-.04em]">You&apos;re on the list.</h3>
                <p className="mx-auto mt-3 max-w-[400px] leading-7 text-[#657084]">We&apos;ll reach out as we begin onboarding early businesses.</p>
                <button type="button" onClick={close} className="button button-primary mt-7">Done</button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                <Field label="First name" name="firstName" autoComplete="given-name" required />
                <Field label="Work email" name="email" type="email" autoComplete="email" required />
                <Field label="Business name" name="businessName" autoComplete="organization" required />
                <label className="text-sm font-medium text-[#313c4d]">Industry<select name="industry" required defaultValue="" className="mt-2 w-full rounded-[10px] border border-[#d8dee7] bg-white px-3 py-3 text-sm outline-none focus:border-[#3158d8] focus:ring-2 focus:ring-[#dfe6ff]"><option value="" disabled>Select one</option><option>Home services</option><option>Professional services</option><option>Construction</option><option>Logistics</option><option>Property management</option><option>Agency</option><option>Other</option></select></label>
                <label className="text-sm font-medium text-[#313c4d]">Number of employees<select name="employees" required defaultValue="" className="mt-2 w-full rounded-[10px] border border-[#d8dee7] bg-white px-3 py-3 text-sm outline-none focus:border-[#3158d8] focus:ring-2 focus:ring-[#dfe6ff]"><option value="" disabled>Select one</option><option>Just me</option><option>1–3</option><option>4–10</option><option>11–20</option><option>21+</option></select></label>
                <label className="text-sm font-medium text-[#313c4d]">Are you currently hiring?<select name="hiring" required defaultValue="" className="mt-2 w-full rounded-[10px] border border-[#d8dee7] bg-white px-3 py-3 text-sm outline-none focus:border-[#3158d8] focus:ring-2 focus:ring-[#dfe6ff]"><option value="" disabled>Select one</option><option>Yes</option><option>Within 3 months</option><option>Within 6 months</option><option>Not currently</option></select></label>
                <label className="text-sm font-medium text-[#313c4d] sm:col-span-2">What is hardest for you to hand off?<textarea name="hardestToHandOff" required rows={3} placeholder="The tasks, decisions, or questions that keep coming back to you..." className="mt-2 w-full resize-none rounded-[10px] border border-[#d8dee7] px-3 py-3 text-sm outline-none placeholder:text-[#9aa3b0] focus:border-[#3158d8] focus:ring-2 focus:ring-[#dfe6ff]" /></label>
                <Field label="Phone number (optional)" name="phone" type="tel" autoComplete="tel" className="sm:col-span-2" />
                {error && <p role="alert" className="rounded-lg bg-[#fff0f1] px-3 py-2 text-center text-xs font-medium text-[#a83f49] sm:col-span-2">{error}</p>}
                <button className="button button-primary mt-2 sm:col-span-2 disabled:cursor-wait disabled:opacity-70" type="submit" disabled={submitting}>{submitting ? "Requesting Access…" : "Request Early Access"}</button>
                <p className="text-center text-xs text-[#7b8492] sm:col-span-2">No credit card required. We&apos;ll only contact you about Opryn.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </EarlyAccessContext.Provider>
  );
}

function Field({ label, name, type = "text", required = false, autoComplete, className = "" }: { label: string; name: string; type?: string; required?: boolean; autoComplete?: string; className?: string }) {
  return <label className={`text-sm font-medium text-[#313c4d] ${className}`}>{label}<input name={name} type={type} required={required} autoComplete={autoComplete} className="mt-2 w-full rounded-[10px] border border-[#d8dee7] px-3 py-3 text-sm outline-none focus:border-[#3158d8] focus:ring-2 focus:ring-[#dfe6ff]" /></label>;
}
