"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "ar_cookie_consent_v1";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as Consent;
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored);
      setShow(false);
    } else {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
    setShow(false);
    // Trigger GA load after consent
    window.dispatchEvent(new CustomEvent("ar:consent:accepted"));
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-describedby="cookie-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5e7eb] bg-white/95 backdrop-blur-sm p-4 dark:border-[#2a2a30] dark:bg-[#0f0f12]/95 sm:max-w-xl sm:rounded-t-2xl sm:bottom-4 sm:right-4 sm:inset-auto sm:shadow-[0_8px_32px_#00000033]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm">
        <p id="cookie-desc" className="text-[#4b5563] dark:text-[#d4d4d8]">
          Usamos cookies para analisar tráfego e melhorar sua experiência.
          <a href="/sobre#privacidade" className="text-[#9333ea] underline underline-offset-2 hover:text-[#a855f7]" target="_blank" rel="noopener">
            Saiba mais
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="flex-1 rounded-[14px] bg-[#0f0f12] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
          >
            Aceitar
          </button>
          <button
            onClick={reject}
            className="flex-1 rounded-full border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]"
          >
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}