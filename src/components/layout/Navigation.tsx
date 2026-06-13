"use client";

import { useStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Magnetic from "@/components/ui/Magnetic";

const NAV_LINKS = [
  { href: "/archive", label: "ARCHIVE" },
  { href: "/inquiry", label: "INQUIRY" },
];

export default function Navigation() {
  const isEntered = useStore((s) => s.isEntered);
  const startTransition = useStore((s) => s.startTransition);
  const pathname = usePathname();
  
  // Local time for the middle column
  const [time, setTime] = useState<string>("00:00:00");

  useEffect(() => {
    if (!isEntered) return;
    const interval = setInterval(() => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes()
        ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isEntered]);

  // Don't show nav until preloader exits
  if (!isEntered) return null;

  const handleNav = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    if (pathname === href) return;
    startTransition(href);
  };

  return (
    <nav
      style={{ viewTransitionName: "site-nav" }}
      className="fixed top-0 left-0 right-0 z-[9990] grid grid-cols-3 items-center px-8 py-8 pointer-events-none"
    >
      {/* Left: Logo */}
      <div className="flex justify-start pointer-events-auto">
        <Magnetic intensity={0.1}>
          <a
            href="/"
            onClick={(e) => handleNav(e, "/")}
            className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity duration-500 uppercase px-4 py-2"
            data-cursor="hover"
          >
            PNB // ESSENCES
          </a>
        </Magnetic>
      </div>

      {/* Middle: Live Status / Time */}
      <div className="flex justify-center pointer-events-none opacity-30">
        <div className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.5em] uppercase flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          SYS_TIME [ {time} LMT ]
        </div>
      </div>

      {/* Right: Navigation Links */}
      <div className="flex justify-end items-center gap-4 pointer-events-auto">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Magnetic key={href} intensity={0.1}>
              <a
                href={href}
                onClick={(e) => handleNav(e, href)}
                className={`
                  relative font-[family-name:var(--font-geist-mono)] text-[9px] tracking-[0.4em] px-4 py-2
                  transition-opacity duration-500 uppercase group
                  ${isActive ? "opacity-80" : "opacity-40 hover:opacity-100"}
                `}
                data-cursor="hover"
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-1 left-4 right-4 h-[1px] bg-white/40" />
                )}
                {!isActive && (
                  <span className="absolute bottom-1 left-4 right-4 h-[1px] bg-white/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
                )}
              </a>
            </Magnetic>
          );
        })}
      </div>
    </nav>
  );
}
