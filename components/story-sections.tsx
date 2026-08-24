import { ArrowRight, Check, CheckCircle2, ChevronRight, FileCheck2, FileText, MessageCircle, Mic, Play } from "lucide-react";
import { SectionIntro } from "./ui";

const interruptions = [
  ["9:14 AM", "How do I create a new customer?"], ["9:37 AM", "Can I give them a discount?"], ["10:08 AM", "Where is the vendor spreadsheet?"], ["10:42 AM", "What do we do when an invoice is overdue?"], ["11:16 AM", "Can you look at this really quick?"],
];

export function PainSection() {
  return (
    <section className="section border-y border-[#e6eaf0] bg-white">
      <div className="container-shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="reveal">
          <SectionIntro label="The daily reality" title="You hired help. Why are you still doing everything?" />
          <blockquote className="mt-7 border-l-2 border-[#3158d8] pl-5 text-xl font-medium leading-8 tracking-[-.02em] text-[#2a3548]">Hiring someone shouldn&apos;t mean becoming their full-time help desk.</blockquote>
          <p className="mt-7 leading-7 text-[#637084]">Most small businesses don&apos;t have an information problem. They have a <strong className="text-[#1e293c]">knowledge transfer problem.</strong> Everything lives in the owner&apos;s memory, inbox, texts, spreadsheets, habits, and unwritten rules.</p>
          <p className="mt-4 leading-7 text-[#637084]">Handoff turns it into something the whole team can actually use.</p>
        </div>
        <div className="reveal relative rounded-[24px] border border-[#e1e6ed] bg-[#f7f9fc] p-4 sm:p-7">
          <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-[#39465a]">Today&apos;s interruptions</span><span className="rounded-full bg-[#fff0f1] px-2 py-1 text-[10px] font-bold text-[#bd4d55]">5 NEW</span></div>
          <div className="space-y-2.5">{interruptions.map(([time, message], index) => <div key={time} className="flex items-start gap-3 rounded-xl border border-[#e0e5ec] bg-white p-3.5 shadow-[0_3px_10px_rgba(25,39,64,.03)]" style={{ marginLeft: `${index * 4}px` }}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf2ff] text-[#3158d8]"><MessageCircle size={14} /></span><div><div className="text-[10px] font-semibold text-[#929ba8]">{time}</div><p className="mt-0.5 text-[13px] font-medium text-[#344052]">&ldquo;{message}&rdquo;</p></div></div>)}</div>
          <div className="absolute -bottom-4 right-5 rounded-lg border border-[#e1e6ed] bg-white px-3 py-2 text-[11px] font-medium text-[#687385] shadow-lg">47 min pulled away</div>
        </div>
      </div>
    </section>
  );
}

const process = ["Open customer profile", "Verify service address", "Check outstanding balance", "Create estimate", "Add job notes", "Send customer confirmation"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="container-shell">
        <SectionIntro label="How Handoff works" title="Don't write a manual. Just do your job." copy="Handoff captures the way work actually happens—then turns it into guidance your team can use." center />
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          <Step number="01" title="Work normally" copy="Record yourself performing a task. Handoff watches the workflow while you explain things naturally.">
            <div className="mt-6 rounded-2xl border border-[#dfe5ed] bg-[#f8fafd] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#3158d8] text-white"><Mic size={17} /></span><div><p className="text-[10px] uppercase tracking-wider text-[#8993a2]">Recording process</p><p className="text-sm font-semibold">&ldquo;Here&apos;s how I create an estimate.&rdquo;</p></div></div><span className="font-mono text-xs text-[#c14c55]">02:14</span></div><div className="mt-4 flex h-9 items-center justify-center gap-[3px] overflow-hidden">{Array.from({length: 32}).map((_,i) => <i key={i} className="w-[2px] rounded-full bg-[#7f95e4]" style={{height:`${8 + ((i * 11) % 24)}px`}} />)}</div></div>
          </Step>
          <Step number="02" title="Handoff learns" copy="It identifies the steps, tools, decisions, rules, exceptions, and responsibilities behind the work.">
            <div className="mt-6 rounded-2xl border border-[#dfe5ed] bg-white p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#3158d8]">Generated process</p><p className="mt-1 text-sm font-semibold">New Customer Estimate</p></div><span className="tag"><CheckCircle2 size={11} /> Ready to review</span></div><ol className="grid grid-cols-2 gap-x-3 gap-y-2">{process.map((item, i) => <li key={item} className="flex items-center gap-2 text-[11px] text-[#586477]"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#f0f3f7] text-[9px] font-semibold">{i+1}</span>{item}</li>)}</ol></div>
          </Step>
          <Step number="03" title="Handoff asks what it missed" copy="A few precise questions capture the exceptions and decisions that live between the steps.">
            <div className="mt-6 rounded-2xl border border-[#dfe5ed] bg-white p-4"><p className="text-xs font-semibold text-[#3158d8]">I have 3 questions</p><div className="mt-3 space-y-2">{["When does a customer need to pay a deposit?","Who can approve discounts over 10%?","What if an existing balance is overdue?"].map((q,i)=><div key={q} className="flex items-center justify-between rounded-lg bg-[#f7f9fc] px-3 py-2.5 text-[11px] text-[#485568]"><span><b className="mr-2 text-[#a0a8b4]">0{i+1}</b>{q}</span><ChevronRight size={13}/></div>)}</div><div className="mt-3 flex gap-2"><span className="tag"><Mic size={10}/> Answer by voice</span><span className="tag bg-[#f2f4f7]! text-[#687385]!"><FileText size={10}/> Type answer</span></div></div>
          </Step>
          <Step number="04" title="Your team can now ask Handoff" copy="Employees get answers grounded in your business—not generic advice from the internet.">
            <div className="mt-6 space-y-2 rounded-2xl border border-[#dfe5ed] bg-[#f8fafd] p-4"><div className="ml-10 rounded-xl rounded-br-sm bg-[#3158d8] p-3 text-[11px] text-white">Can this customer split their payment?</div><div className="mr-6 rounded-xl rounded-bl-sm border border-[#e0e5ec] bg-white p-3 text-[11px] leading-5 text-[#435064]">Yes. Split payments are available on jobs over $5,000.<div className="mt-2 border-t border-[#edf0f4] pt-2 text-[9px] font-semibold text-[#3158d8]">Source: Payment Policy → Split Payments</div></div></div>
          </Step>
        </div>
      </div>
    </section>
  );
}

function Step({ number, title, copy, children }: { number: string; title: string; copy: string; children: React.ReactNode }) {
  return <article className="reveal soft-card p-6 sm:p-8"><div className="mb-5 flex items-center gap-3"><span className="font-mono text-xs font-semibold text-[#3158d8]">{number}</span><span className="h-px w-8 bg-[#cdd5e2]" /></div><h3 className="text-2xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-3 max-w-[500px] text-sm leading-6 text-[#687487]">{copy}</p>{children}</article>;
}

export function LearningLoop() {
  return (
    <section className="section bg-[#0d1729] text-white">
      <div className="container-shell grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div className="reveal"><div className="section-label text-[#88a3ff]">The learning loop</div><h2 className="section-title">Answer a question once.</h2><p className="mt-6 text-lg leading-8 text-[#aab4c4]">Every question reveals a knowledge gap. Every answer makes your company easier to operate.</p><div className="mt-8 flex items-center gap-3 text-sm font-semibold text-white"><span className="grid size-8 place-items-center rounded-full bg-[#3158d8]"><Check size={16}/></span>Next time, Handoff answers automatically.</div></div>
        <div className="reveal grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4 sm:col-span-2"><div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#77849a]">Sarah · Employee</div><div className="inline-block max-w-[420px] rounded-xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-[#182238]">Can we let a customer pay 50% now and 50% after the job?</div><div className="mt-3 ml-auto max-w-[430px] rounded-xl rounded-tr-sm bg-[#23304a] px-4 py-3 text-sm leading-6 text-[#c8d1df]">I don&apos;t know your company&apos;s policy for this yet.<button className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#9bb0ff]">Ask owner <ArrowRight size={12}/></button></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[#88a3ff]">Sarah needs help</p><p className="mt-2 text-sm font-semibold">Can customers split payments?</p><div className="mt-4 flex items-center gap-3 rounded-xl bg-[#121e33] p-3"><button className="grid size-9 place-items-center rounded-full bg-[#3158d8]" aria-label="Play owner's voice answer"><Play size={14} fill="currentColor"/></button><div className="flex flex-1 items-center gap-[2px]">{Array.from({length:18}).map((_,i)=><i key={i} className="w-[2px] rounded-full bg-[#8299e9]" style={{height:`${6 + ((i*7)%18)}px`}} />)}</div><span className="font-mono text-[9px] text-[#7f8998]">0:06</span></div><p className="mt-3 text-[11px] italic leading-5 text-[#a8b2c1]">“Yes, but only for jobs over $5,000.”</p></div>
          <div className="rounded-2xl border border-[#4366df]/40 bg-[#172543] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9eb2ff]"><FileCheck2 size={13}/> New company rule detected</div><p className="mt-4 text-sm font-semibold leading-6">Split payments are allowed on jobs over $5,000.</p><div className="mt-4 flex gap-2"><button className="rounded-lg bg-[#3158d8] px-3 py-2 text-[11px] font-semibold">Approve Rule</button><button className="rounded-lg border border-white/15 px-3 py-2 text-[11px] font-semibold text-[#b8c2d1]">Edit</button></div></div>
        </div>
      </div>
    </section>
  );
}
