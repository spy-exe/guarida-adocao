"""
Levanta fotos candidatas no Wikimedia Commons e monta uma folha de contato.

So entram arquivos com licenca livre que permite uso com atribuicao (CC0,
dominio publico, CC BY e CC BY-SA). Autor e licenca vem do proprio arquivo,
nao de suposicao.
"""
import html, json, re, sys, time, urllib.parse, urllib.request

AGENTE = "guarida-curadoria/1.0 (projeto acadêmico; https://github.com/spy-exe/guarida-adocao)"
LICENCAS = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+)", re.I)

def buscar(categoria, limite=40):
    parametros = {
        "action": "query", "format": "json", "generator": "categorymembers",
        "gcmtitle": "Category:" + categoria, "gcmtype": "file", "gcmlimit": str(limite),
        "prop": "imageinfo", "iiprop": "url|extmetadata|mime|size", "iiurlwidth": "960",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(parametros)
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=30) as r:
        dados = json.load(r)
    saida = []
    for p in dados.get("query", {}).get("pages", {}).values():
        ii = p.get("imageinfo", [{}])[0]
        meta = ii.get("extmetadata", {})
        licenca = meta.get("LicenseShortName", {}).get("value", "")
        if ii.get("mime") != "image/jpeg" or not LICENCAS.match(licenca):
            continue
        if ii.get("width", 0) < 1000 or ii.get("width", 0) < ii.get("height", 0) * 0.9:
            continue  # pequena demais ou em retrato alto, que corta mal no cartao
        autor = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()
        autor = re.sub(r"\s+", " ", html.unescape(autor))[:120]
        saida.append({
            "categoria": categoria, "titulo": p["title"], "miniatura": ii["thumburl"],
            "pagina": ii["descriptionurl"], "autor": autor, "licenca": licenca,
            "largura": ii["width"], "altura": ii["height"],
        })
    return saida

if __name__ == "__main__":
    categorias = sys.argv[2:]
    todas = []
    for categoria in categorias:
        try:
            todas += buscar(categoria)
        except Exception as erro:
            print("falhou", categoria, erro, file=sys.stderr)
        time.sleep(1)
    json.dump(todas, open(sys.argv[1] + ".json", "w"), ensure_ascii=False, indent=1)
    celulas = "".join(
        f'<figure><img src="{c["miniatura"]}"><figcaption><b>{i}</b> {html.escape(c["licenca"])} · '
        f'{html.escape(c["autor"][:28])}<br>{html.escape(c["categoria"])}</figcaption></figure>'
        for i, c in enumerate(todas))
    open(sys.argv[1] + ".html", "w").write(
        "<style>body{margin:0;font:13px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:6px}"
        "figure{margin:0}img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}"
        "figcaption{height:34px;overflow:hidden}</style>" + celulas)
    print(len(todas), "candidatas em", sys.argv[1])
