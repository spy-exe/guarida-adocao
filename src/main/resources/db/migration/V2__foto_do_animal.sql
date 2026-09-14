-- A foto mora em tabela propria, e nao em coluna do animal, porque a listagem
-- do catalogo le dezenas de animais por pagina e nao pode arrastar os bytes de
-- cada imagem junto. Quem precisa so do credito consulta as colunas leves.
CREATE TABLE foto_do_animal (
    animal_id     BIGINT        NOT NULL PRIMARY KEY,
    conteudo      BYTEA         NOT NULL,
    tipo          VARCHAR(20)   NOT NULL,
    tamanho       INTEGER       NOT NULL,
    versao        VARCHAR(16)   NOT NULL,
    autor         VARCHAR(160),
    licenca       VARCHAR(60),
    fonte         VARCHAR(300),
    atualizada_em TIMESTAMP(6)  NOT NULL,
    CONSTRAINT fk_foto_animal FOREIGN KEY (animal_id) REFERENCES animal (id) ON DELETE CASCADE
);
