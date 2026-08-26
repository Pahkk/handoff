"use client";

import { ArrowDown, ArrowRight, TrendingUp } from "lucide-react";
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

export function Hero() {
  const { openEarlyAccess } = useEarlyAccess();
  return (
    <section
      id="top"
      className="relative overflow-hidden pb-24 pt-[138px] sm:pb-28 sm:pt-[154px]"
    >
      <div className="grid-noise pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <div className="pointer-events-none absolute left-[12%] top-[-180px] size-[520px] rounded-full bg-[#dfe7ff]/55 blur-[100px]" />
      <div className="container-shell relative grid items-center gap-16 lg:grid-cols-[.93fr_1.07fr] lg:gap-14">
        <div className="hero-copy">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9e0ec] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#536075] shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#3158d8]" />
            Your business shouldn&apos;t stop when you do.
          </div>
          <h1 className="display-title balance">
            Build a business that doesn&apos;t depend on you.
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
          <p className="mt-6 flex max-w-[500px] items-center gap-2 text-xs leading-5 text-[#788393]">
            <span className="status-pulse size-1.5 shrink-0 rounded-full bg-[#42a583]" />
            Built for owners going from doing everything themselves to building
            a real team.
          </p>
          <div
            className="mt-6 flex flex-wrap gap-2"
            aria-label="Opryn product benefits"
          >
            {[
              "Teach naturally",
              "Answers with sources",
              "Asks when unsure",
            ].map((benefit) => (
              <span
                key={benefit}
                className="rounded-full border border-[#dfe5ed] bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-[#58667a] shadow-sm backdrop-blur"
              >
                {benefit}
              </span>
            ))}
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
      </div>
    </section>
  );
}
