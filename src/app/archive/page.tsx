"use client";

import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import VelocitySkew from "@/components/ui/VelocitySkew";
import { useStore } from "@/lib/store";
import { ViewTransition } from "react";
import Image from "next/image";

const FORMULAS = [
  {
    num: 1,
    name: "Noir Vétiver",
    conc: "32.5%",
    vol: "50ML",
    note: "Earthy · Smoky · Resinous",
    desc: "A raw, territorial accord built on smoked vetiver and black resins. For those who move without announcement.",
    year: "MMXXV",
    image: "/images/noir-vetiver.png",
    video: "/videos/noir-vetiver.mp4",
  },
  {
    num: 2,
    name: "Blanche Iris",
    conc: "28.0%",
    vol: "50ML",
    note: "Floral · Powdery · Ethereal",
    desc: "Powdered iris root dissolves into white musks and cold aldehydes. Presence felt before arrival.",
    year: "MMXXV",
    image: "/images/blanche-iris.png",
    video: "/videos/blanche-iris.mp4",
  },
  {
    num: 3,
    name: "Oud Obscur",
    conc: "36.0%",
    vol: "50ML",
    note: "Dark · Balsamic · Incense",
    desc: "Cambodian oud, sacred incense, and aged benzoin. The heaviest formula in the archive.",
    year: "MMXXV",
    image: "/images/oud-obscur.png",
    video: "/videos/oud-obscur.mp4",
  },
];

export default function ArchivePage() {
  const startTransition = useStore((s) => s.startTransition);

  return (
    // ViewTransition wraps the page so the enter animation fires on navigation
    <ViewTransition>
      <main className="w-full min-h-screen pt-24 pb-32 px-8 md:px-24">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 mb-4 mt-8">
          <div className="w-12 h-[1px] bg-white/20" />
          <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.5em] opacity-30 uppercase">
            Formula Archive
          </span>
          <div className="w-12 h-[1px] bg-white/20" />
        </div>

        <RevealText
          tag="h1"
          splitBy="chars"
          triggerOnLoad
          className="font-[family-name:var(--font-playfair)] font-light text-5xl md:text-7xl lg:text-8xl tracking-[0.08em] mb-3 leading-none"
        >
          The Archive
        </RevealText>
        <p className="font-[family-name:var(--font-inter)] text-sm opacity-30 tracking-widest mb-24 max-w-xs leading-relaxed">
          Three formulas. Each classified. Each limited.
        </p>

        {/* ── Formula list — editorial vertical layout ─────────────────── */}
        <div className="space-y-0">
          {FORMULAS.map((item, i) => (
            <VelocitySkew key={item.num} intensity={0.04} maxSkew={10}>
              <div
                className="group relative flex flex-col md:flex-row md:items-center gap-8 py-12 border-t border-white/[0.06] cursor-pointer hover:border-white/20 transition-colors duration-700"
                data-cursor="hover"
              >
                {/* Formula number */}
                <div className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.5em] opacity-20 group-hover:opacity-60 transition-opacity duration-500 md:w-24 shrink-0">
                  F–{String(item.num).padStart(2, "0")}
                </div>

                {/* Viewfinder placeholder */}
                <div className="md:w-48 aspect-[3/2] md:aspect-[4/3] relative overflow-hidden flex items-center justify-center shrink-0">
                  <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/15 group-hover:border-white/40 transition-colors duration-700 z-20" />
                  <span className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/15 group-hover:border-white/40 transition-colors duration-700 z-20" />
                  <span className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/15 group-hover:border-white/40 transition-colors duration-700 z-20" />
                  <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/15 group-hover:border-white/40 transition-colors duration-700 z-20" />
                  
                  {/* Center cross hides on hover */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/8 to-transparent group-hover:via-white/0 transition-all duration-700 z-20" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/8 to-transparent group-hover:via-white/0 transition-all duration-700 z-20" />
                  
                  {/* Classified Text hides on hover */}
                  <div className="font-[family-name:var(--font-geist-mono)] text-[8px] tracking-[0.4em] opacity-10 group-hover:opacity-0 transition-opacity duration-700 text-center z-20">
                    <div>F–{String(item.num).padStart(2, "0")}</div>
                    <div className="opacity-60 mt-1">CLASSIFIED</div>
                  </div>

                  {/* High-End Video Reveal */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-10">
                    <video
                      src={item.video}
                      poster={item.image}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-[1.5s] ease-out"
                    />
                  </div>
                  
                  {/* Hover inner glow */}
                  <div className="absolute inset-0 bg-gradient-radial from-white/10 via-black/40 to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 mix-blend-overlay" />
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <h2 className="font-[family-name:var(--font-playfair)] font-light text-3xl md:text-4xl italic mb-3 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    {item.name}
                  </h2>
                  <div className="w-8 h-[1px] bg-white/20 mb-4 group-hover:w-20 transition-all duration-500" />
                  <p className="font-[family-name:var(--font-inter)] text-sm opacity-30 tracking-wide max-w-sm leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <div className="font-[family-name:var(--font-geist-mono)] text-[10px] opacity-20 tracking-[0.3em] space-x-4">
                    <span>{item.note}</span>
                    <span>·</span>
                    <span>CONC: {item.conc}</span>
                    <span>·</span>
                    <span>{item.vol}</span>
                  </div>
                </div>

                {/* Right: year + inquiry CTA */}
                <div className="flex flex-col items-end gap-4 shrink-0">
                  <div className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] opacity-15">
                    {item.year}
                  </div>
                  <Magnetic intensity={0.2}>
                    <button
                      onClick={() => startTransition("/inquiry")}
                      className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.35em] opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-opacity duration-500 uppercase border border-white/10 hover:border-white/30 px-4 py-2"
                      data-cursor="hover"
                    >
                      Inquire →
                    </button>
                  </Magnetic>
                </div>

                {/* Animated left accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/0 group-hover:bg-white/10 transition-colors duration-700" />

                {/* Stagger index */}
                <div
                  className="absolute right-0 top-12 font-[family-name:var(--font-geist-mono)] text-[8px] tracking-[0.4em] opacity-8"
                  style={{ writingMode: "vertical-rl" }}
                >
                  {String(i + 1).padStart(2, "0")} / 03
                </div>
              </div>
            </VelocitySkew>
          ))}

          {/* Bottom border */}
          <div className="border-t border-white/[0.06]" />
        </div>

        {/* ── Footer nav ──────────────────────────────────────────────────── */}
        <div className="mt-24 flex justify-between items-center">
          <Magnetic intensity={0.2}>
            <button
              onClick={() => startTransition("/")}
              className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] opacity-20 hover:opacity-60 transition-opacity duration-500 uppercase"
              data-cursor="hover"
            >
              ← The Laboratory
            </button>
          </Magnetic>
          <Magnetic intensity={0.2}>
            <button
              onClick={() => startTransition("/inquiry")}
              className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] opacity-20 hover:opacity-60 transition-opacity duration-500 uppercase"
              data-cursor="hover"
            >
              Secure Access →
            </button>
          </Magnetic>
        </div>
      </main>
    </ViewTransition>
  );
}
