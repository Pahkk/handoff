import { ArrowRight, Check, Info } from "lucide-react";
import type { ReactNode } from "react";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a href="#top" className={`inline-flex items-center gap-2.5 font-semibold tracking-[-.03em] ${inverse ? "text-white" : "text-[#111b2e]"}`} aria-label="Opryn home">
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-[#3158d8] shadow-[0_5px_13px_rgba(49,88,216,.25)]">
        <span className="absolute h-3.5 w-[7px] -translate-x-[3px] rounded-full border-2 border-white" />
        <span className="absolute h-3.5 w-[7px] translate-x-[3px] rounded-full border-2 border-white" />
      </span>
      <span className="text-[19px]">Opryn</span>
    </a>
  );
}

export function AppWindow({ children, label = "Opryn" }: { children: ReactNode; label?: string }) {
  return (
    <div className="app-window">
      <div className="window-bar">
        <i className="window-dot" /><i className="window-dot" /><i className="window-dot" />
        <span className="ml-2 text-[10px] font-medium text-[#8b95a5]">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SectionIntro({ label, title, copy, center = false }: { label?: string; title: string; copy?: string; center?: boolean }) {
  return (
    <div className={`${center ? "mx-auto max-w-[760px] text-center" : "max-w-[680px]"}`}>
      {label && <div className={`section-label ${center ? "before:hidden" : ""}`}>{label}</div>}
      <h2 className="section-title balance">{title}</h2>
      {copy && <p className="lead mt-5 balance">{copy}</p>}
    </div>
  );
}

export function CheckItem({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <li className={`flex items-start gap-3 text-sm leading-6 ${muted ? "text-[#6b7584]" : "text-[#2b3546]"}`}>
      <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[#edf2ff] text-[#3158d8]"><Check size={11} strokeWidth={3} /></span>
      {children}
    </li>
  );
}

export function ProductButton({ children }: { children: ReactNode }) {
  return <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-[#3158d8] px-3 py-2 text-[11px] font-semibold text-white shadow-sm">{children}<ArrowRight size={12} /></button>;
}

export function Insight({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 rounded-xl border border-[#dbe3ff] bg-[#f4f6ff] p-3 text-xs leading-5 text-[#40527d]"><Info size={14} className="mt-0.5 shrink-0 text-[#3158d8]" />{children}</div>;
}

export function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const colors = { blue: "bg-[#3158d8]", green: "bg-[#1b8b69]", amber: "bg-[#d28b2c]", red: "bg-[#c14c55]" };
  return <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} /></div>;
}
