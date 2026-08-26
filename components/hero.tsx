"use client";

import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  MessageCircleQuestion,
  Mic2,
  TrendingUp,
} from "lucide-react";
import { useEarlyAccess } from "./early-access";
import { AppWindow, Insight, ProductButton, Progress } from "./ui";
import { OprynLogo } from "./opryn-logo";

const areas = [
  ["Customer Scheduling", 91, "green"],
  ["Invoicing", 84, "green"],
  ["Customer Support", 63, "blue"],
  ["Purchasing", 34, "amber"],
  ["Payroll", 12, "red"],
] as const;

const heroLoopSteps = [
  { icon: Mic2, title: "Teach", copy: "Explain work naturally" },
  {
    icon: MessageCircleQuestion,
    title: "Ask",
    copy: "Your team gets answers",
  },
  {
    icon: CheckCircle2,
    title: "Learn",
    copy: "New answers become knowledge",
  },
] as const;

export function Hero() {
  const { openEarlyAccess } = useEarlyAccess();
  return (
    <section id="top" className="hero-section relative overflow-hidden">
      <div className="grid-noise pointer-events-none absolute inset-x-0 top-0 h-[820px]" />
      <div className="pointer-events-none absolute left-[8%] top-[-220px] size-[560px] rounded-full bg-[#dfe7ff]/60 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-180px] top-[180px] size-[480px] rounded-full bg-[#e9f6f1]/70 blur-[120px]" />
      <div className="container-shell relative grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <div className="hero-copy">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9e0ec] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#536075] shadow-sm backdrop-blur">
            <span className="status-pulse size-1.5 rounded-full bg-[#1b8b69]" />
            Built for owners ready to delegate
          </div>
          <h1 className="display-title balance">
            Build a business that{" "}
            <span className="hero-emphasis">doesn&apos;t depend on you.</span>
          </h1>
          <p className="lead mt-7 max-w-[610px]">
            Opryn learns how you run your business, turns what you know into
            repeatable systems, and helps the people you hire work without
            constantly asking you what to do.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="button button-primary min-w-[154px]"
              onClick={openEarlyAccess}
            >
              Get Early Access <ArrowRight size={15} />
            </button>
            <a
              className="button button-secondary min-w-[160px]"
              href="#how-it-works"
            >
              See How It Works <ArrowDown size={15} />
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#6b7789]">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#1b8b69]" /> No manual to
              write
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#1b8b69]" /> Answers show
              their source
            </span>
          </div>
        </div>
        <div className="hero-visual relative lg:translate-x-3">
          <div className="absolute -inset-5 -z-10 rounded-[36px] bg-gradient-to-br from-[#e8edff] via-[#f1f4fb] to-transparent" />
          <AppWindow label="Business health / Owner independence">
            <div className="grid min-h-[470px] md:grid-cols-[146px_1fr]">
              <aside className="hidden border-r border-[#e4e8ee] bg-[#fafbfc] p-4 md:block">
                <div className="mb-5">
                  <OprynLogo size="small" className="origin-left scale-75" />
                </div>
                {[
                  "Overview",
                  "Knowledge",
                  "Processes",
                  "Roles",
                  "Questions",
                ].map((item, i) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-2 py-2 text-[9px] ${i === 0 ? "bg-[#edf2ff] font-semibold text-[#3158d8]" : "text-[#7a8493]"}`}
                  >
                    {item}
                  </div>
                ))}
              </aside>
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="app-kicker">Owner independence</p>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="metric text-[42px] font-semibold leading-none">
                        68
                      </span>
                      <span className="mb-1 text-sm text-[#9aa3af]">/ 100</span>
                    </div>
                  </div>
                  <span className="tag">
                    <TrendingUp size={11} /> +6 this month
                  </span>
                </div>
                <div className="space-y-4">
                  {areas.map(([name, value, tone]) => (
                    <div key={name}>
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="font-medium text-[#364153]">
                          {name}
                        </span>
                        <span className="font-semibold text-[#687385]">
                          {value}% delegated
                        </span>
                      </div>
                      <Progress value={value} tone={tone} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-[#e5e9ef] pt-5">
                  <Insight>
                    <div>
                      <strong className="block text-[#26395d]">
                        You answered 37 employee questions this month.
                      </strong>
                      Opryn could have answered 26.
                    </div>
                  </Insight>
                  <div className="mt-3">
                    <ProductButton>Fix knowledge gaps</ProductButton>
                  </div>
                </div>
              </div>
            </div>
          </AppWindow>
          <div className="float-card absolute -bottom-7 -left-5 hidden rounded-xl border border-[#dfe5ec] bg-white p-3 shadow-[0_15px_35px_rgba(25,40,68,.13)] sm:flex sm:items-center sm:gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-[#eaf7f2] text-[#1b8b69]">
              <TrendingUp size={15} />
            </span>
            <div>
              <p className="text-[10px] text-[#7b8696]">
                Interruptions avoided
              </p>
              <p className="text-sm font-semibold">72% this month</p>
            </div>
          </div>
        </div>
        <div
          className="hero-loop reveal lg:col-span-2"
          aria-label="How Opryn helps"
        >
          <div className="hero-loop-intro">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3158d8]">
              One simple loop
            </p>
            <p className="mt-1 text-sm font-semibold text-[#263247]">
              Your company gets smarter every time you teach it.
            </p>
          </div>
          {heroLoopSteps.map(({ icon: Icon, title, copy }, index) => (
            <div className="hero-loop-step" key={title}>
              <span className="hero-loop-icon">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#202b3e]">{title}</p>
                <p className="mt-0.5 text-[11px] text-[#7a8595]">{copy}</p>
              </div>
              {index < heroLoopSteps.length - 1 ? (
                <ArrowRight className="hero-loop-arrow" size={16} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
