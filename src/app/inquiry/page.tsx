"use client";

import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import { useStore } from "@/lib/store";
import { ViewTransition } from "react";

export default function InquiryPage() {
  const startTransition = useStore((s) => s.startTransition);

  return (
    <ViewTransition>
      <main className="w-full min-h-screen flex flex-col items-center justify-center relative pt-24 pb-32 px-8">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,134,10,0.04) 0%, transparent 65%)",
          }}
        />

        {/* Scanline texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)",
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center text-center gap-10 max-w-lg">
          {/* Section label */}
          <div className="flex items-center gap-6">
            <div className="w-8 h-[1px] bg-white/20" />
            <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.5em] opacity-30 uppercase">
              Private Inquiry
            </span>
            <div className="w-8 h-[1px] bg-white/20" />
          </div>

          {/* Main heading */}
          <RevealText
            tag="h1"
            splitBy="chars"
            triggerOnLoad
            className="font-[family-name:var(--font-playfair)] font-light text-5xl md:text-7xl opacity-85 leading-none tracking-wide"
          >
            Secure Access
          </RevealText>

          {/* Descriptor */}
          <p className="font-[family-name:var(--font-inter)] text-sm opacity-30 tracking-widest leading-relaxed">
            Reserved for discerning clients.
            <br />
            No public registry.
          </p>

          {/* Terminal-style status box */}
          <div className="relative p-8 w-full">
            <span className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/20" />
            <span className="absolute top-0 right-0 w-5 h-5 border-t border-r border-white/20" />
            <span className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-white/20" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/20" />
            <div className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.2em] space-y-3 text-left">
              <div className="text-white/20">
                PROTOCOL: ENCRYPTED CHANNEL
              </div>
              <div className="text-white/20">
                CHANNEL: VAULT@PNBESSENCES.COM
              </div>
              <div className="text-white/40">
                STATUS: ACCEPTING INQUIRIES
              </div>
            </div>
          </div>

          {/* Email CTA */}
          <Magnetic intensity={0.3}>
            <a
              href="mailto:vault@pnbessences.com"
              className="group relative font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.4em] opacity-50 hover:opacity-100 transition-opacity duration-500 p-8 inline-block uppercase"
              data-cursor="hover"
            >
              {/* Corner marks */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 group-hover:border-white/60 transition-colors duration-500" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 group-hover:border-white/60 transition-colors duration-500" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 group-hover:border-white/60 transition-colors duration-500" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 group-hover:border-white/60 transition-colors duration-500" />
              vault@pnbessences.com
              <span className="absolute bottom-6 left-8 right-8 h-[1px] bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </a>
          </Magnetic>

          {/* Disclaimer */}
          <p className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.3em] opacity-15 uppercase">
            Response within 48 hours · Invitation only
          </p>
        </div>

        {/* Footer nav */}
        <div className="absolute bottom-12 left-8 right-8 flex justify-between items-center">
          <Magnetic intensity={0.2}>
            <button
              onClick={() => startTransition("/archive")}
              className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] opacity-20 hover:opacity-60 transition-opacity duration-500 uppercase"
              data-cursor="hover"
            >
              ← The Archive
            </button>
          </Magnetic>
          <div className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.3em] opacity-10 uppercase">
            PNB · MMXXV
          </div>
        </div>
      </main>
    </ViewTransition>
  );
}
