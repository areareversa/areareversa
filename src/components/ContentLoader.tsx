"use client";

import { useEffect } from "react";

export function ContentLoader() {
  useEffect(() => {
    const saved = sessionStorage.getItem("ar_ai_content");
    if (saved) {
      const ta = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
      if (ta) ta.value = saved;
      sessionStorage.removeItem("ar_ai_content");
    }
  }, []);
  return null;
}
