"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import type { BillingInterval, PlanId } from "@/lib/billing/plans";

const coreFeatures = [
  "Ask Opryn and employee Q&A",
  "Up to 5 employees",
  "Processes and company rules",
  "Text and audio learning",
  "Document uploads and Google Drive import",
  "Roles, training, and knowledge gaps",
  "Owner question inbox",
  "Basic time-saved tracking",
];
const premiumFeatures = [
  "Everything in Core",
  "Up to 20 employees",
  "Video and screen-recording learning",
  "Learn From Calls",
  "Sales and customer-call analysis",
  "Recurring questions and objections",
  "Real-call training examples",
  "Advanced knowledge and time-saved insights",
  "Priority AI processing",
];

export function PricingPage({
  signedIn,
  canManage,
  annualEnabled,
  billingReady,
  initialCheckout,
}: {
  signedIn: boolean;
  canManage: boolean;
  annualEnabled: boolean;
  billingReady: boolean;
  initialCheckout?: PlanId;
}) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const started = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    if (
      !initialCheckout ||
      !signedIn ||
      !canManage ||
      !billingReady ||
      started.current
    )
      return;
    started.current = true;
    setRedirecting(true);
    void fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: initialCheckout, interval: "month" }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.url) throw new Error();
        window.location.assign(body.url);
      })
      .catch(() => setRedirecting(false));
  }, [initialCheckout, signedIn, canManage, billingReady]);
  return (
    <main className="bg-[#f7f9fc] px-4 pb-20 pt-28 text-[#111b2e] sm:px-6">
      {redirecting ? (
        <div
          role="status"
          className="fixed inset-0 z-[100] grid place-items-center bg-white/85 backdrop-blur-sm"
        >
          <div className="text-center">
            <LoaderCircle className="mx-auto size-8 animate-spin text-[#3158d8]" />
            <p className="mt-4 text-sm font-semibold">
              Opening secure checkout…
            </p>
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#3158d8]">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">
            Get your time back.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#687487] sm:text-lg">
            Choose how much of the teaching, answering, and training you want
            Opryn to handle.
          </p>
          {annualEnabled ? (
            <div className="mx-auto mt-8 inline-flex rounded-xl border border-[#d9e0e9] bg-white p-1">
              <ToggleButton
                active={interval === "month"}
                onClick={() => setInterval("month")}
              >
                Monthly
              </ToggleButton>
              <ToggleButton
                active={interval === "year"}
                onClick={() => setInterval("year")}
              >
                Annual · Save 20%
              </ToggleButton>
            </div>
          ) : null}
        </div>
        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-2">
          <PlanCard
            plan="core"
            title="Opryn Core"
            price={interval === "year" ? 79 : 99}
            billingNote={
              interval === "year" ? "billed annually" : "billed monthly"
            }
            copy="For small businesses starting to get company knowledge out of the owner's head."
            features={coreFeatures}
            interval={interval}
            signedIn={signedIn}
            canManage={canManage}
            billingReady={billingReady}
          />
          <PlanCard
            plan="premium"
            title="Opryn Premium"
            price={interval === "year" ? 199 : 249}
            billingNote={
              interval === "year" ? "billed annually" : "billed monthly"
            }
            copy="For owners who want Opryn learning directly from how the business actually works."
            features={premiumFeatures}
            interval={interval}
            signedIn={signedIn}
            canManage={canManage}
            billingReady={billingReady}
            featured
          />
        </div>
        <PricingFAQ />
      </div>
    </main>
  );
}

function PlanCard({
  plan,
  title,
  price,
  billingNote,
  copy,
  features,
  interval,
  signedIn,
  canManage,
  billingReady,
  featured = false,
}: {
  plan: PlanId;
  title: string;
  price: number;
  billingNote: string;
  copy: string;
  features: string[];
  interval: BillingInterval;
  signedIn: boolean;
  canManage: boolean;
  billingReady: boolean;
  featured?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to start checkout.");
      window.location.assign(body.url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start checkout.",
      );
      setLoading(false);
    }
  }
  const signupPath = `/signup?next=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(`/pricing?checkout=${plan}`)}`)}`;
  return (
    <article
      className={`relative flex flex-col rounded-[24px] border bg-white p-6 sm:p-8 ${featured ? "border-[#3158d8] shadow-[0_24px_70px_rgba(49,88,216,.14)]" : "border-[#dfe5ed]"}`}
    >
      {featured ? (
        <span className="absolute right-5 top-5 rounded-full bg-[#eaf7f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[.09em] text-[#177257]">
          Most Popular
        </span>
      ) : null}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 min-h-14 max-w-lg text-sm leading-6 text-[#6c788b]">
        {copy}
      </p>
      <div className="mt-6 flex items-end gap-2">
        <strong className="text-5xl font-semibold tracking-[-.055em]">
          ${price}
        </strong>
        <span className="pb-1 text-sm text-[#788396]">/month</span>
      </div>
      <p className="mt-1 text-xs text-[#8a94a3]">{billingNote}</p>
      {featured ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#177257]">
          <ShieldCheck className="size-4" /> 14-day free trial for eligible
          workspaces
        </p>
      ) : null}
      <ul className="my-7 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-[#56647a]">
            <Check className="mt-0.5 size-4 shrink-0 text-[#2b9875]" />
            {feature}
          </li>
        ))}
      </ul>
      {!signedIn ? (
        <Link href={signupPath} className={buttonClass(featured)}>
          {plan === "premium" ? "Start Premium" : "Start with Core"}
          <ArrowRight className="size-4" />
        </Link>
      ) : canManage ? (
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={loading || !billingReady}
          className={buttonClass(featured)}
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {!billingReady
            ? "Billing setup required"
            : plan === "premium"
              ? "Start Premium"
              : "Start with Core"}
          {!loading && billingReady ? <ArrowRight className="size-4" /> : null}
        </button>
      ) : (
        <p className="rounded-xl bg-[#f3f5f8] p-3 text-center text-xs font-semibold text-[#657184]">
          Ask a workspace owner to change the plan.
        </p>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-xs text-[#a83f49]">
          {error}
        </p>
      ) : null}
    </article>
  );
}

function buttonClass(featured: boolean) {
  return `mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${featured ? "bg-[#3158d8] text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8]" : "border border-[#d3dae5] text-[#30405a] hover:bg-[#f7f9fc]"}`;
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs font-semibold ${active ? "bg-[#3158d8] text-white" : "text-[#687487]"}`}
    >
      {children}
    </button>
  );
}

function PricingFAQ() {
  const items = [
    [
      "Can I upgrade later?",
      "Yes. Organizations can upgrade from Core to Premium at any time.",
    ],
    [
      "What happens if I downgrade?",
      "Approved company knowledge remains available. New video and call analysis becomes unavailable.",
    ],
    [
      "Do employees need separate subscriptions?",
      "No. Employee access is included up to the plan's team limit.",
    ],
    [
      "Is call recording automatic?",
      "No. The first version analyzes recordings your business intentionally provides.",
    ],
    [
      "Does Opryn listen without permission?",
      "No. Opryn only processes calls intentionally uploaded by an authorized business.",
    ],
  ];
  return (
    <section className="mx-auto mt-20 max-w-3xl">
      <h2 className="text-center text-3xl font-semibold tracking-[-.04em]">
        Pricing questions
      </h2>
      <div className="mt-8 divide-y divide-[#e2e7ed] rounded-2xl border border-[#dfe5ed] bg-white px-5 sm:px-7">
        {items.map(([question, answer]) => (
          <details key={question} className="group py-5">
            <summary className="cursor-pointer list-none text-sm font-semibold">
              {question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-[#6a7689]">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
