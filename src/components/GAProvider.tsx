"use client";

import { useEffect } from "react";
import Script from "next/script";
import { site } from "@/lib/site";

const GA_ID = "G-FRTNFD1KQD";

export function GAProvider() {
  useEffect(() => {
    const stored = localStorage.getItem("ar_cookie_consent_v1");
    if (stored !== "accepted") return;

    loadGA();
  }, []);

  useEffect(() => {
    const handleConsent = () => {
      loadGA();
    };

    window.addEventListener("ar:consent:accepted", handleConsent);
    return () => window.removeEventListener("ar:consent:accepted", handleConsent);
  }, []);

  return null;
}

function loadGA() {
  if (window.gtagLoaded) return;
  window.gtagLoaded = true;

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  // Load external gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

// Extend window type
declare global {
  interface Window {
    gtagLoaded: boolean;
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}