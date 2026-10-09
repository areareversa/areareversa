"use client";

import { useState } from "react";
import { GAEvents } from "@/lib/gaEvents";

interface HeadingWithCopyProps {
  level: 2 | 3;
  children: React.ReactNode;
  id?: string;
}

export function HeadingWithCopy({ level, children, id }: HeadingWithCopyProps) {
  const headingId = id || String(children).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [copied, setCopied] = useState(false);
  const Tag = `h${level}` as "h2" | "h3";

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      GAEvents.copyHeadingLink(String(children), url);
    });
  };

  return (
    <Tag id={headingId} className="relative group">
      {children}
      <button
        onClick={copyLink}
        aria-label={copied ? "Link copiado!" : `Copiar link para "${String(children)}"`}
        className={`absolute -left-10 opacity-0 group-hover:opacity-100 transition-opacity text-[#9ca3af] hover:text-[#9333ea] dark:text-[#6b7280] dark:hover:text-[#a855f7] ${copied ? "opacity-100 text-[#22c55e]" : ""}`}
        style={{ top: "0.25em" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
    </Tag>
  );
}