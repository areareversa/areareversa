# Próximos Passos - Implementação Completa

## 1. Banner de Consentimento GA (LGPD/GDPR) ✅ PRIORIDADE ALTA
- Componente `CookieConsent` que bloqueia GA até aceitar
- Armazenar preferência no localStorage
- Integrar com gtag (carregar só após consentimento)

## 2. Blur Placeholders nas Cover Images
- Gerar `blurDataURL` no build ou usar placeholder base64 genérico
- Adicionar `placeholder="blur"` no `next/image` dos posts

## 3. Structured Data (JSON-LD)
- `WebSite` + `SearchAction` no layout
- `Organization` no layout
- `BreadcrumbList` nas páginas (blog, post, tag, categoria)
- `Article` já existe no post - verificar completude

## 4. PWA com next-pwa
- Instalar `next-pwa`
- Configurar `next.config.ts` com `withPWA`
- Manifest já existe em `src/app/manifest.ts`
- Service worker para cache offline

## 5. Testes de Produção
- Verificar CSP no console
- Validar Lighthouse (Performance, A11y, SEO, PWA)
- Testar fluxos críticos