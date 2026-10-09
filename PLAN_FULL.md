# Plano Completo de Melhorias - área reversa

## Fase 1: Alta Prioridade (Esta semana)

### 1.1 Table of Contents (TOC) ✅
- Componente client-side que extrai h2/h3 do artigo
- Sticky lateral no desktop, colapsável no mobile
- Links com scroll suave + highlight ativo
- Schema.org `TableOfContents` para SEO

### 1.2 GA Events Customizados ✅
- Scroll depth: 25%, 50%, 75%, 100%
- TTS: play, pause, stop, voice_change, chunk_complete
- Shares: copy, native, twitter, linkedin, whatsapp
- Newsletter: signup_success, signup_error
- Podcast: play, pause, next, previous, episode_complete
- Search: query, results_count, click_result

### 1.3 Font Display Optional ✅
- Adicionar `font-display: optional` nos @font-face do globals.css
- Elimina CLS/FOIT

### 1.4 Error Boundaries ✅
- Boundary genérico para layout
- Boundaries específicos: Markdown, TTS, Comments, Player
- Fallback UI amigável + botão "Tentar novamente"

### 1.5 Loading Skeletons ✅
- Skeleton para cards do blog (PostGrid)
- Skeleton para página de post (meta, cover, conteúdo)
- Skeleton para podcast episodes

---

## Fase 2: Média Prioridade (Próximos dias)

### 2.1 Modo Leitura Distraction-Free ✅
- Botão no header do post: "Modo foco"
- Overlay full-screen: só título + controles (fonte/TTS) + conteúdo
- Escurece fundo, esconde header/footer/sidebar
- Persiste preferência no localStorage

### 2.2 Copy Heading Links ✅
- Botão "🔗" ao lado de cada h2/h3
- Copia URL com `#heading-id`
- Tooltip "Link copiado!"

### 2.3 Busca Melhorada ✅
- Debounce 300ms no SearchModal
- Highlight termos nos resultados
- Navegação por teclado (↑/↓/Enter)
- Loading state

### 2.4 Web Share API Nativa ✅
- `navigator.share()` no mobile
- Fallback para ShareButtons atual
- Inclui título + URL + descrição

### 2.5 Newsletter Double Opt-in ✅
- Endpoint `/api/newsletter/confirm?token=`
- Email de confirmação com link
- Welcome email após confirmação
- Unsubscribe link em todos emails

### 2.6 RSS Melhorado ✅
- `<content:encoded>` com HTML completo
- `<media:content>` para episódios de podcast
- `<itunes:>` tags para Apple Podcasts
- `<atom:link rel="self">`

### 2.7 Sitemap lastmod Dinâmico ✅
- Usar `post.updatedAt` ou `post.createdAt`
- Incluir páginas estáticas (sobre, podcast, tags)

---

## Fase 3: Desejável / Polimento

### 3.1 Prefetch on Hover ✅
- `prefetch` nos cards do PostGrid
- `router.prefetch()` no hover do Link

### 3.2 Admin Analytics Dashboard ✅
- Gráficos: views/dia, top 10 posts, referrers, dispositivos
- Período: 7d, 30d, 90d
- Export CSV

### 3.3 Full-text Search PostgreSQL ✅
- Coluna `tsvector` + GIN index
- `websearch_to_tsquery` para queries naturais
- Rank por `ts_rank_cd`

### 3.4 Comentários Webmentions ✅
- Endpoint `/api/webmention` (receive)
- Enviar webmentions ao linkar posts externos
- Exibir como comentários normais

### 3.5 Dark Mode System Preference ✅
- Default: `prefers-color-scheme`
- Toggle manual sobrescreve
- Persiste no localStorage

---

## Checklist de Execução

- [ ] 1.1 TOC Component
- [ ] 1.2 GA Events
- [ ] 1.3 Font Display Optional
- [ ] 1.4 Error Boundaries
- [ ] 1.5 Loading Skeletons
- [ ] 2.1 Distraction-Free Mode
- [ ] 2.2 Copy Heading Links
- [ ] 2.3 Busca Melhorada
- [ ] 2.4 Web Share API
- [ ] 2.5 Newsletter Double Opt-in
- [ ] 2.6 RSS Melhorado
- [ ] 2.7 Sitemap lastmod
- [ ] 3.1 Prefetch on Hover
- [ ] 3.2 Admin Analytics
- [ ] 3.3 Full-text Search
- [ ] 3.4 Webmentions
- [ ] 3.5 Dark Mode System Pref

---

## Notas Técnicas

- Manter build passing em cada commit
- Testar no mobile/desktop
- Verificar acessibilidade (WCAG AA)
- Não quebrar funcionalidades existentes