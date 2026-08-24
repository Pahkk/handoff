"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useEarlyAccess } from "./early-access";
import { AccountControls } from "./auth";
import { Logo } from "./ui";

const links = [
  ["How It Works", "#how-it-works"], ["Product", "#product"], ["Who It’s For", "#who-its-for"], ["Pricing", "#pricing"],
];

export function Navbar() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openEarlyAccess } = useEarlyAccess();
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 12); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "border-b border-[#e3e8ef]/85 bg-[#fbfcfe]/88 shadow-[0_5px_20px_rgba(25,38,59,.04)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="container-shell flex h-[72px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <a key={href} href={href} className="text-[13px] font-medium text-[#576274] transition-colors hover:text-[#111b2e]">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex"><AccountControls /><button className="button button-primary" type="button" onClick={openEarlyAccess}>Get Early Access</button></div>
        <button type="button" className="grid size-10 place-items-center rounded-xl border border-[#dce2e9] bg-white lg:hidden" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Toggle navigation menu">{menu ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
      {menu && <nav className="border-t border-[#e4e8ee] bg-white px-5 py-4 shadow-lg lg:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-[640px] flex-col">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)} className="border-b border-[#edf0f4] py-3.5 text-sm font-medium">{label}</a>)}<AccountControls mobile /><button className="button button-primary mt-2" onClick={() => { setMenu(false); openEarlyAccess(); }}>Get Early Access</button></div></nav>}
    </header>
  );
}

export function Footer() {
  return <footer className="border-t border-[#1f2b3d] bg-[#0d1729] py-8 text-white"><div className="container-shell flex flex-col items-center justify-between gap-5 sm:flex-row"><Logo inverse /><p className="text-xs text-[#8e99aa]">© 2026 Handoff, Inc. Built for owners building real teams.</p><a className="text-xs text-[#aeb8c6] hover:text-white" href="mailto:hello@handoff.so">hello@handoff.so</a></div></footer>;
}
