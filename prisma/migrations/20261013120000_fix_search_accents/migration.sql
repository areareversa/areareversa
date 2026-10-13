-- Busca em português: sem acento, tolerante a palavra incompleta e a cedilha.
--
-- Três problemas corrigidos aqui:
--
-- 1. Acentos — o stemmer 'portuguese' mantém o cedilha ("orçamento" vira
--    'orçament'), então buscar "oramento" não acha nada.
--
-- 2. Stemmer inconsistente — o 'portuguese' diverge entre indexar e consultar
--    em quase toda palavra:
--       vetor de 'orçamento' → 'orcament' | consulta de 'oramento' → 'orament'
--       vetor de 'eleição'   → 'eleica'   | consulta de 'eleicoes' → 'eleico'
--    Solução: configuração 'simple' (sem stemming) + prefixo na consulta.
--
-- 3. Cedilha — mesmo sem acento, "orçamento" vira "orcamento" (ç→c) e quem
--    digita "oramento" continua sem achar. Indexamos duas variantes: com e sem
--    a cedilha.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- STABLE (e não IMMUTABLE) porque unaccent() consulta um dicionário; é
-- determinístico na prática, mas o Postgres não tem como saber disso.
CREATE OR REPLACE FUNCTION posts_search_text(p_title TEXT, p_excerpt TEXT, p_content TEXT, p_tags TEXT[])
RETURNS TEXT AS $$
  SELECT unaccent(
    coalesce(p_title, '') || ' ' ||
    coalesce(p_excerpt, '') || ' ' ||
    coalesce(p_content, '') || ' ' ||
    coalesce(array_to_string(p_tags, ' '), '')
  );
$$ LANGUAGE sql STABLE;

-- Texto indexado: a variante normal e a variante sem cedilha, lado a lado.
--
-- A cedilha precisa ser removida ANTES do unaccent: depois dele já virou "c",
-- e remover o "ç" não faria nada (a segunda variante sairia idêntica à
-- primeira).
CREATE OR REPLACE FUNCTION posts_search_doc(p_title TEXT, p_excerpt TEXT, p_content TEXT, p_tags TEXT[])
RETURNS TEXT AS $$
  SELECT unaccent(concat_ws(' ', p_title, p_excerpt, p_content, array_to_string(p_tags, ' ')))
      || ' ' ||
         unaccent(
           replace(
             replace(concat_ws(' ', p_title, p_excerpt, p_content, array_to_string(p_tags, ' ')), 'ç', ''),
             'Ç', ''
           )
         );
$$ LANGUAGE sql STABLE;

-- Trigger antigo, deixado por um script avulso anterior a este projeto de
-- busca. Ele NÃO usava unaccent e rodava por último (ordem alfabética),
-- sobrescrevendo o vetor correto. Precisa sair.
DROP TRIGGER IF EXISTS posts_search_vector_update ON posts;

CREATE OR REPLACE FUNCTION posts_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector(
    'simple',
    posts_search_doc(NEW.title, NEW.excerpt, NEW.content, NEW.tags)
  )::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_vector ON posts;
CREATE TRIGGER posts_search_vector
  BEFORE INSERT OR UPDATE OF title, excerpt, content, tags
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_vector_trigger();

-- Reindexa o que já existe
UPDATE posts
   SET "searchVector" = to_tsvector('simple', posts_search_doc(title, excerpt, content, tags))::text;

-- Índice GIN: sem ele a busca faz varredura sequencial em toda a tabela
DROP INDEX IF EXISTS posts_searchVector_idx;
CREATE INDEX posts_searchVector_idx ON posts USING GIN (("searchVector"::tsvector));