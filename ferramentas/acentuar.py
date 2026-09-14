"""
Acentua o texto que o usuario le, sem tocar em identificador.

So altera o conteudo de literais de string (aspas simples, duplas, crase e
blocos de texto do Java) e, em arquivos TSX, o texto entre tags. Palavras
ambiguas, como "esta" e "e", ficam de fora de proposito: acentuar errado e pior
que nao acentuar.
"""
import re
import sys
import pathlib

PALAVRAS = {
    "adocao": "adoção", "adocoes": "adoções", "historia": "história", "historias": "histórias",
    "especie": "espécie", "especies": "espécies", "disponivel": "disponível",
    "disponiveis": "disponíveis", "indisponivel": "indisponível", "medio": "médio",
    "femea": "fêmea", "passaro": "pássaro", "passaros": "pássaros", "docil": "dócil",
    "timido": "tímido", "brincalhao": "brincalhão", "sociavel": "sociável", "criancas": "crianças",
    "caes": "cães", "cao": "cão", "espaco": "espaço", "vermifugo": "vermífugo",
    "castracao": "castração", "veterinaria": "veterinária", "atualizacao": "atualização",
    "devolucao": "devolução", "sitio": "sítio", "chacara": "chácara", "analise": "análise",
    "situacao": "situação", "situacoes": "situações", "requisicao": "requisição",
    "invalida": "inválida", "invalido": "inválido", "validacao": "validação", "nao": "não",
    "maximo": "máximo", "minimo": "mínimo", "numero": "número", "operacao": "operação",
    "autenticacao": "autenticação", "voce": "você", "ja": "já", "tambem": "também",
    "alteracao": "alteração", "alteracoes": "alterações", "exclusao": "exclusão",
    "recem": "recém", "mes": "mês", "responsavel": "responsável", "publico": "público",
    "catalogo": "catálogo", "familia": "família", "ate": "até", "so": "só", "apos": "após",
    "ninguem": "ninguém", "entao": "então", "possivel": "possível", "codigo": "código",
    "periodo": "período", "obrigatorio": "obrigatório", "tres": "três", "rapido": "rápido",
    "proprio": "próprio", "propria": "própria", "licenca": "licença", "credito": "crédito",
    "acao": "ação", "acoes": "ações", "informacao": "informação", "observacoes": "observações",
    "saude": "saúde", "tracos": "traços", "traco": "traço", "raca": "raça", "racas": "raças",
    "portao": "portão", "servico": "serviço", "emissao": "emissão", "comeco": "começo",
    "concluida": "concluída", "concluidas": "concluídas", "medias": "médias", "media": "média",
    "rotulo": "rótulo", "area": "área", "sera": "será", "facil": "fácil", "agil": "ágil",
    "caderneta": "caderneta", "vitrine": "vitrine", "abrigo": "abrigo", "mutirao": "mutirão",
    "senior": "sênior", "idosa": "idosa", "ultimos": "últimos", "ultima": "última",
    "ultimo": "último", "preferencia": "preferência", "agua": "água", "pessoa": "pessoa",
    "ficara": "ficará", "recebera": "receberá", "contato": "contato", "endereco": "endereço",
    "cadastro": "cadastro", "acesso": "acesso", "rapida": "rápida", "voluntario": "voluntário",
    "dificil": "difícil", "sozinho": "sozinho", "sao": "são", "joao": "joão", "marica": "maricá",
    "niteroi": "niterói", "goncalo": "gonçalo", "itaborai": "itaboraí", "ha": None,
    "excluido": "excluído", "visao": "visão", "estao": "estão", "mantem": "mantém",
    "contem": "contém", "vazio": "vazio", "unica": "única", "unico": "único", "logica": "lógica",
    "pagina": "página", "paginas": "páginas", "numeros": "números", "especifico": "específico",
    "tambem": "também", "incluido": "incluído", "saida": "saída", "silenciavel": "silenciável",
}

SQL = re.compile(r"\b(select|from|where|group by|order by|insert|update|delete from|join)\b", re.I)

def trocar_palavra(m):
    palavra = m.group(0)
    minuscula = palavra.lower()
    alvo = PALAVRAS.get(minuscula)
    if alvo is None:
        return palavra
    if palavra.isupper() and len(palavra) > 1:
        return palavra  # constante de enum ou sigla: nunca mexe
    if palavra[0].isupper():
        return alvo[0].upper() + alvo[1:]
    return alvo

# palavra solta: sem hifen, arroba, ponto, barra ou sublinhado colados,
# que indicariam e-mail, URL, caminho ou identificador
REGEX_PALAVRA = re.compile(r"(?<![\w@./\-])[A-Za-z]+(?![\w@/\-]|\.\w)")
# chave de JSON dentro de bloco de texto: "especie": fica como esta
CHAVE_JSON = re.compile(r'"[A-Za-z_]\w*"\s*:')

def acentuar_texto(texto):
    protegidos = []

    def guardar(m):
        protegidos.append(m.group(0))
        return f"\x00{len(protegidos) - 1}\x00"

    texto = CHAVE_JSON.sub(guardar, texto)
    texto = REGEX_PALAVRA.sub(trocar_palavra, texto)
    return re.sub(r"\x00(\d+)\x00", lambda m: protegidos[int(m.group(1))], texto)

# literal Java: bloco de texto, depois string comum
REGEX_JAVA = re.compile(r'"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"')
# literal TS: crase, aspas duplas, aspas simples
REGEX_TS = re.compile(r'`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|\'(?:\\.|[^\'\\\n])*\'')
# texto entre tags JSX, sem chaves
REGEX_JSX = re.compile(r'>([^<>{}]*[A-Za-z][^<>{}]*)<')

INTOCAVEIS = re.compile(r'^["\'`](/|https?:|@/|\$|[A-Z_]+["\'`]$|[a-z]+[A-Z]\w*["\'`]$|[a-z-]+/[a-z])')

def processar_literal(m):
    literal = m.group(0)
    miolo = literal.strip("\"'`")
    if re.fullmatch(r"[a-z][A-Za-z0-9_.]*", miolo):
        return literal  # palavra unica minuscula: nome de campo, chave, parametro
    if literal.startswith('"""') and SQL.search(literal):
        return literal  # consulta JPQL ou SQL: nome de coluna e atributo nao se acentua
    if INTOCAVEIS.match(literal):
        return literal  # rota, import, jsonPath, enum, nome de campo
    if literal.startswith("`") and "${" in literal and not re.search(r"[a-z]{4,} [a-z]{3,}", literal):
        return literal
    return acentuar_texto(literal)

def processar(caminho):
    original = caminho.read_text(encoding="utf-8")
    if caminho.suffix == ".java":
        novo = REGEX_JAVA.sub(processar_literal, original)
    else:
        novo = REGEX_TS.sub(processar_literal, original)
        if caminho.suffix == ".tsx":
            novo = REGEX_JSX.sub(lambda m: ">" + acentuar_texto(m.group(1)) + "<", novo)
    if novo != original:
        caminho.write_text(novo, encoding="utf-8")
        return True
    return False

if __name__ == "__main__":
    alterados = [str(p) for raiz in sys.argv[1:] for p in pathlib.Path(raiz).rglob("*")
                 if p.suffix in {".java", ".ts", ".tsx"} and "node_modules" not in p.parts and processar(p)]
    print(len(alterados), "arquivos alterados")
    for a in alterados:
        print(" ", a)
