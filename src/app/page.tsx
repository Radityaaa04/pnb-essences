"use client";

import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import ScrambleText from "@/components/ui/ScrambleText";
import VelocitySkew from "@/components/ui/VelocitySkew";
import Parallax from "@/components/ui/Parallax";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { audioManager } from "@/lib/audioManager";

export default function Home() {
  const triggerBurst = useStore((state) => state.triggerBurst);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cinematic transitions: trigger chromatic burst when sections enter view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerBurst();
          }
        });
      },
      { threshold: 0.2 } // Trigger when 20% of section is visible
    );

    const sections = document.querySelectorAll("section");
    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [triggerBurst]);

  return (
    <main ref={containerRef} className="w-full">
      {/* I. The Core (Hero) */}
      <section id="hero" className="h-screen w-full flex flex-col items-center justify-center relative">
        {/* Top-left coordinates — cinematic detail, positioned safely away from bottle */}
        <div className="absolute top-8 left-8 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.25em] opacity-20 select-none pointer-events-none">
          <div>48°51′N  2°21′E</div>
          <div className="mt-1 opacity-60">LAT — LON</div>
        </div>

        {/* Edition badge — top right */}
        <div className="absolute top-8 right-8 font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.2em] opacity-20 select-none pointer-events-none text-right">
          <div>BATCH 001</div>
          <div className="mt-1 opacity-60">LIMITED EDITION</div>
        </div>

        <Parallax speed={0.8} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mix-blend-difference w-full h-full">
          <RevealText
            tag="h1"
            splitBy="chars"
            triggerOnLoad
            className="font-[family-name:var(--font-playfair)] font-light text-6xl md:text-[8rem] lg:text-[10rem] tracking-[0.15em] uppercase leading-none"
          >
            PNB Essences
          </RevealText>
          <RevealText
            tag="p"
            splitBy="words"
            triggerOnLoad
            delay={0.5}
            className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.5em] mt-6 opacity-40"
          >
            STEALTH · PRECISION · CRAFTSMANSHIP
          </RevealText>
        </Parallax>

        {/* Scroll indicator — pinned to bottom, clear of the glowing bottle center */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
          <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] opacity-30 uppercase">Scroll to extract</span>
          {/* Animated line */}
          <div className="relative w-[1px] h-16 overflow-hidden bg-white/10">
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-white to-transparent h-1/2 animate-scroll-line" />
          </div>
        </div>
      </section>

      {/* II. The Extraction */}
      <section id="extraction" className="min-h-screen w-full flex flex-col justify-center px-8 md:px-24 py-24 relative">
        <div className="max-w-2xl">
          <RevealText
            tag="h2"
            splitBy="lines"
            className="font-[family-name:var(--font-playfair)] font-light text-4xl md:text-6xl mb-10 leading-tight"
          >
            The Laboratory
          </RevealText>
          <div className="font-[family-name:var(--font-inter)] text-base leading-loose opacity-50 mb-12 max-w-md tracking-wide">
            We extract the purest essence from raw nature. Combining cold,
            precise methodology with untamed elements to craft formulas that
            operate under the radar.
          </div>

          {/* DATA BOX — upgraded from plain border to corner-mark style */}
          <div 
            className="relative inline-block p-8 group cursor-pointer" 
            data-cursor="hover"
            onMouseEnter={() => audioManager.playHover()}
          >
            {/* Corner marks — replaces cheap border */}
            <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/30 group-hover:border-white/70 transition-colors duration-500" />
            <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/30 group-hover:border-white/70 transition-colors duration-500" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/30 group-hover:border-white/70 transition-colors duration-500" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/30 group-hover:border-white/70 transition-colors duration-500" />

            <div className="font-[family-name:var(--font-geist-mono)] text-sm space-y-2">
              <div className="text-white/90">
                <ScrambleText text="DATA: BATCH 001" delay={200} />
              </div>
              <div className="text-white/40">
                <ScrambleText text="LOCATION: CLASSIFIED" delay={600} />
              </div>
              <div className="text-white/40">
                <ScrambleText text="STATUS: ACTIVE" delay={1000} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* III. The Archive */}
      <section id="archive" className="min-h-screen w-full flex flex-col items-center justify-center relative">
        {/* Section label */}
        <div className="flex items-center gap-6 mb-16">
          <div className="w-12 h-[1px] bg-white/20" />
          <RevealText
            tag="h2"
            splitBy="chars"
            className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.5em] opacity-40 uppercase"
          >
            The Archive
          </RevealText>
          <div className="w-12 h-[1px] bg-white/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-8">
          {[
            { num: 1, name: "Noir Vétiver", conc: "32.5%", vol: "50ML", note: "Earthy · Smoky · Resinous" },
            { num: 2, name: "Blanche Iris", conc: "28.0%", vol: "50ML", note: "Floral · Powdery · Ethereal" },
            { num: 3, name: "Oud Obscur",   conc: "36.0%", vol: "50ML", note: "Dark · Balsamic · Incense" },
          ].map((item) => (
            <VelocitySkew key={item.num} intensity={0.05} maxSkew={15}>
              <Magnetic intensity={0.15}>
                <div
                  className="group flex flex-col items-start p-8 relative cursor-pointer transition-all duration-700 hover:bg-white/[0.03]"
                  data-cursor="hover"
                  onMouseEnter={() => audioManager.playHover()}
                >
                  {/* Corner marks on hover */}
                  <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-transparent group-hover:border-white/20 transition-all duration-500" />
                  <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-transparent group-hover:border-white/20 transition-all duration-500" />
                  <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-transparent group-hover:border-white/20 transition-all duration-500" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-transparent group-hover:border-white/20 transition-all duration-500" />

                  {/* Product visual — minimal luxury framing */}
                  <div className="w-full aspect-[3/4] mb-8 relative overflow-hidden flex items-center justify-center">
                    {/* Elegant cross-hair / viewfinder detail */}
                    <span className="absolute top-4 left-4 w-3 h-3 border-t border-l border-white/15 group-hover:border-white/35 transition-colors duration-700" />
                    <span className="absolute top-4 right-4 w-3 h-3 border-t border-r border-white/15 group-hover:border-white/35 transition-colors duration-700" />
                    <span className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-white/15 group-hover:border-white/35 transition-colors duration-700" />
                    <span className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-white/15 group-hover:border-white/35 transition-colors duration-700" />
                    {/* Vertical center line */}
                    <div className="absolute top-1/4 bottom-1/4 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:via-white/20 transition-all duration-700" />
                    {/* Formula code */}
                    <div className="font-[family-name:var(--font-geist-mono)] text-[8px] tracking-[0.5em] opacity-15 group-hover:opacity-30 transition-opacity duration-700 uppercase text-center leading-relaxed">
                      <div>F–{String(item.num).padStart(2, "0")}</div>
                      <div className="mt-2 opacity-60">CLASSIFIED</div>
                    </div>
                    {/* Subtle inner glow on hover */}
                    <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>

                  {/* Formula number */}
                  <div className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.4em] opacity-30 mb-3">
                    F–{String(item.num).padStart(2, '0')}
                  </div>

                  {/* Name — editorial weight */}
                  <h3 className="font-[family-name:var(--font-playfair)] font-light text-2xl mb-2 group-hover:opacity-100 opacity-80 transition-opacity duration-500 italic">
                    {item.name}
                  </h3>

                  {/* Divider */}
                  <div className="w-8 h-[1px] bg-white/20 mb-4 group-hover:w-16 transition-all duration-500" />

                  {/* Notes */}
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] opacity-30 tracking-wider mb-1">
                    {item.note}
                  </p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] opacity-20 tracking-[0.3em]">
                    CONC: {item.conc} · VOL: {item.vol}
                  </p>
                </div>
              </Magnetic>
            </VelocitySkew>
          ))}
        </div>
      </section>

      {/* IV. Inquiry — completely redesigned as editorial footer */}
      <section className="relative w-full py-32 flex flex-col items-center overflow-hidden">
        {/* Top rule */}
        <div className="w-full max-w-5xl px-8 mb-24">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Ambient glow behind text */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(200,134,10,0.05) 0%, transparent 70%)" }}
        />

        <div className="flex flex-col items-center text-center gap-10">
          {/* Eyebrow */}
          <div className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.6em] opacity-30 uppercase">
            Private Inquiry
          </div>

          {/* Big serif CTA */}
          <RevealText
            tag="h2"
            splitBy="chars"
            className="font-[family-name:var(--font-playfair)] font-light text-5xl md:text-7xl opacity-80 leading-none tracking-wide"
          >
            Secure Access
          </RevealText>

          {/* Subline */}
          <p className="font-[family-name:var(--font-inter)] text-sm opacity-30 tracking-widest max-w-xs text-center leading-relaxed">
            Reserved for discerning clients.<br />No public registry.
          </p>

          {/* Email CTA with magnetic + animated underline */}
          <Magnetic intensity={0.3}>
            <a
              href="mailto:vault@pnbessences.com"
              className="group relative font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.4em] opacity-60 hover:opacity-100 transition-opacity duration-500 p-6 inline-block uppercase"
              data-cursor="hover"
              onMouseEnter={() => audioManager.playHover()}
            >
              vault@pnbessences.com
              {/* Animated underline */}
              <span className="absolute bottom-4 left-6 right-6 h-[1px] bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </a>
          </Magnetic>
        </div>

        {/* Bottom rule + copyright */}
        <div className="w-full max-w-5xl px-8 mt-24">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
          <div className="flex justify-between items-center font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.3em] opacity-20 uppercase">
            <span>PNB Essences</span>
            <span>Stealth Luxury · Est. MMXXV</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </section>
    </main>
  );
}
