"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number; // ms to wait after global enter
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export default function ScrambleText({ text, className, delay = 0 }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState("");
  const isEntered = useStore((state) => state.isEntered);
  const frameRef = useRef<number | null>(null);
  const queueRef = useRef<{ from: string; to: string; start: number; end: number; char?: string }[]>([]);
  const frameCountRef = useRef(0);

  useEffect(() => {
    // Generate initial scrambled state
    setDisplayText(
      Array.from({ length: text.length })
        .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
        .join("")
    );
  }, [text]);

  useEffect(() => {
    if (!isEntered) return;

    let timeoutId: NodeJS.Timeout;

    const startScramble = () => {
      let length = 0;
      queueRef.current = [];
      
      for (let i = 0; i < text.length; i++) {
        const from = CHARS[Math.floor(Math.random() * CHARS.length)];
        const to = text[i];
        // Ensure whitespace stays whitespace for layout stability
        if (to === " ") {
          queueRef.current.push({ from: " ", to: " ", start: 0, end: 0 });
          continue;
        }
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        queueRef.current.push({ from, to, start, end });
        length = Math.max(length, end);
      }

      frameCountRef.current = 0;
      cancelAnimationFrame(frameRef.current!);
      update();
    };

    const update = () => {
      let output = "";
      let complete = 0;
      const queue = queueRef.current;

      for (let i = 0, n = queue.length; i < n; i++) {
        let { from, to, start, end, char } = queue[i];

        if (frameCountRef.current >= end) {
          complete++;
          output += to;
        } else if (frameCountRef.current >= start) {
          if (!char || Math.random() < 0.28) {
            char = CHARS[Math.floor(Math.random() * CHARS.length)];
            queue[i].char = char;
          }
          output += `<span class="opacity-50 text-white">${char}</span>`;
        } else {
          output += `<span class="opacity-30">${from}</span>`;
        }
      }

      setDisplayText(output);

      if (complete === queue.length) {
        setDisplayText(text); // clean final string
        cancelAnimationFrame(frameRef.current!);
      } else {
        frameRef.current = requestAnimationFrame(update);
        frameCountRef.current++;
      }
    };

    timeoutId = setTimeout(startScramble, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isEntered, text, delay]);

  return (
    <span 
      className={className} 
      dangerouslySetInnerHTML={{ __html: displayText || "&nbsp;" }} 
    />
  );
}
