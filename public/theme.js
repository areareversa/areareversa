/*
 * Aplica o tema salvo antes da primeira pintura.
 *
 * Fica em arquivo próprio (e não inline no layout) por um motivo específico:
 * o layout precisava ler o nonce do CSP via headers(), e headers() é uma API
 * dinâmica do Next.js — usá-la no layout raiz tornava TODA página dinâmica e
 * desligava o cache da CDN inteiro (todas respondiam "no-store").
 *
 * Script externo da própria origem não precisa de nonce: o CSP já tem
 * 'self' em script-src.
 */
(function () {
  try {
    var t = localStorage.getItem("ar_theme_v2");
    if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else if (t === "system") {
      document.documentElement.classList.toggle(
        "dark",
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } else {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();