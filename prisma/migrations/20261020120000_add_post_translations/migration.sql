-- Traduções dos posts (inglês e espanhol).
--
-- O site passou a ter versões em /en-US e /es-ES, mas não havia onde guardar o
-- texto traduzido: a página lia `post.title_en`, o campo não existia e tudo caía
-- silenciosamente no português. Aqui nascem as colunas.
--
-- Nulo (ou vazio) significa "não traduzido": a página usa o texto em português
-- como fallback, então um post novo continua aparecendo nos três idiomas — só
-- que em pt-BR até alguém preencher a tradução no admin.
--
-- Os nomes são curtos (_en / _es) em vez de seguir o código do locale
-- (en-US / es-ES): hífen em nome de coluna exige aspas em toda query e não traz
-- nenhum ganho — a conversão locale → sufixo fica no código.

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "title_en"   TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "excerpt_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content_en" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "title_es"   TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "excerpt_es" TEXT NOT NULL DEFAULT '';
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "content_es" TEXT;

-- A busca (tsvector) é montada em pt-BR. As traduções não entram nela: o índice
-- é por idioma e o ganho não compensa a complexidade agora.
