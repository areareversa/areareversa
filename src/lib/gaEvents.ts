"use client";

const GA_ID = "G-FRTNFD1KQD";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function sendEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

export const GAEvents = {
  // Scroll depth
  scrollDepth: (depth: 25 | 50 | 75 | 100) => {
    sendEvent("scroll_depth", { depth, timestamp: Date.now() });
  },

  // TTS events
  ttsPlay: (title: string, chunkIndex?: number, totalChunks?: number) => {
    sendEvent("tts_play", { title, chunkIndex, totalChunks });
  },
  ttsPause: (title: string, chunkIndex?: number) => {
    sendEvent("tts_pause", { title, chunkIndex });
  },
  ttsStop: (title: string) => {
    sendEvent("tts_stop", { title });
  },
  ttsVoiceChange: (voiceName: string, lang: string) => {
    sendEvent("tts_voice_change", { voiceName, lang });
  },
  ttsChunkComplete: (title: string, chunkIndex: number, totalChunks: number) => {
    sendEvent("tts_chunk_complete", { title, chunkIndex, totalChunks });
  },

  // Share events
  share: (method: "copy" | "native" | "twitter" | "linkedin" | "whatsapp" | "facebook" | "instagram" | "tiktok", url: string, title: string) => {
    sendEvent("share", { method, url, title });
  },

  // Newsletter
  newsletterSignup: (email: string, success: boolean, error?: string) => {
    sendEvent("newsletter_signup", { email: success ? email : "redacted", success, error });
  },

  // Podcast
  podcastPlay: (episodeTitle: string, episodeUrl: string) => {
    sendEvent("podcast_play", { episodeTitle, episodeUrl });
  },
  podcastPause: (episodeTitle: string) => {
    sendEvent("podcast_pause", { episodeTitle });
  },
  podcastNext: (episodeTitle: string) => {
    sendEvent("podcast_next", { episodeTitle });
  },
  podcastPrevious: (episodeTitle: string) => {
    sendEvent("podcast_previous", { episodeTitle });
  },
  podcastEpisodeComplete: (episodeTitle: string) => {
    sendEvent("podcast_episode_complete", { episodeTitle });
  },

  // Search
  search: (query: string, resultsCount: number) => {
    sendEvent("search", { query, resultsCount });
  },
  searchClickResult: (query: string, resultTitle: string, resultUrl: string, position: number) => {
    sendEvent("search_click_result", { query, resultTitle, resultUrl, position });
  },

  // Reading mode
  fontSizeChange: (size: number) => {
    sendEvent("font_size_change", { size });
  },

  // Distraction-free mode
  focusModeToggle: (enabled: boolean) => {
    sendEvent("focus_mode_toggle", { enabled });
  },

  // Copy heading link
  copyHeadingLink: (headingText: string, url: string) => {
    sendEvent("copy_heading_link", { headingText, url });
  },

  // Generic click (for CTA buttons, etc.)
  ctaClick: (ctaName: string, location: string) => {
    sendEvent("cta_click", { ctaName, location });
  },
};

// Scroll depth tracker hook
export function useScrollDepth() {
  if (typeof window === "undefined") return;

  const depths = [25, 50, 75, 100] as const;
  const triggered = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    depths.forEach((depth) => {
      if (scrollPercent >= depth && !triggered.has(depth)) {
        triggered.add(depth);
        GAEvents.scrollDepth(depth);
      }
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}