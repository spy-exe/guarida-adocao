import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ErroDaApi } from "@/lib/api";

function resposta(status: number, corpo?: unknown, texto?: string) {
  const conteudo = texto ?? (corpo === undefined ? null : JSON.stringify(corpo));
  return new Response(status === 204 ? null : conteudo, { status });
}

describe("cliente da API", () => {
  const busca = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", busca);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    busca.mockReset();
  });

  it("monta os filtros do catálogo na query, só com o que foi preenchido", async () => {
    busca.mockResolvedValue(resposta(200, { itens: [] }));
    await api.catalogo({ especie: "GATO", porte: "PEQUENO", sexo: "FEMEA", status: "DISPONIVEL", temperamento: "CALMO",
                         apenasFilhotes: true, cidade: "Niterói", busca: "pérola", tamanho: 12, pagina: 2 });

    const [url, opcoes] = busca.mock.calls[0];
    const query = new URLSearchParams(url.split("?")[1]);
    expect(url.startsWith("/api/v1/animais?")).toBe(true);
    expect(Object.fromEntries(query)).toEqual({ especie: "GATO", porte: "PEQUENO", sexo: "FEMEA", status: "DISPONIVEL",
      temperamento: "CALMO", apenasFilhotes: "true", cidade: "Niterói", busca: "pérola", size: "12", page: "2" });
    expect(opcoes).toMatchObject({ method: "GET", headers: {} });
  });

  it("usa página zero e 24 itens quando nada é pedido", async () => {
    busca.mockResolvedValue(resposta(200, { itens: [] }));
    await api.catalogo();
    expect(busca.mock.calls[0][0]).toBe("/api/v1/animais?size=24&page=0");
  });

  it("manda JSON com token e devolve o corpo", async () => {
    busca.mockResolvedValue(resposta(201, { id: 3 }));
    const criado = await api.cadastrarAnimal("tok", { nome: "Bidu" });

    const [url, opcoes] = busca.mock.calls[0];
    expect(url).toBe("/api/v1/animais");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer tok" });
    expect(opcoes.body).toBe(JSON.stringify({ nome: "Bidu" }));
    expect(criado).toEqual({ id: 3 });
  });

  it("devolve nulo quando a resposta vem vazia, como no 204", async () => {
    busca.mockResolvedValue(resposta(204));
    await expect(api.excluirAnimal("tok", 3)).resolves.toBeNull();
  });

  it("transforma o ProblemDetail em erro com os campos reprovados", async () => {
    busca.mockResolvedValue(resposta(400, { title: "Dados inválidos", detail: "Confira", campos: { nome: "obrigatório" } }));
    const erro = await api.registrar({ nome: "", email: "", senha: "", cidade: "" }).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroDaApi);
    expect(erro).toMatchObject({ message: "Confira", status: 400, campos: { nome: "obrigatório" }, name: "ErroDaApi" });
  });

  it("cai para o título e depois para o código quando falta detalhe", async () => {
    busca.mockResolvedValueOnce(resposta(409, { title: "Conflito" }));
    await expect(api.entrar({ email: "a", senha: "b" })).rejects.toMatchObject({ message: "Conflito", campos: {} });

    busca.mockResolvedValueOnce(resposta(502, undefined, "<html>proxy caiu</html>"));
    await expect(api.eu("tok")).rejects.toMatchObject({ message: "Erro 502", status: 502 });
  });

  it("explica quando a rede nem chegou na API", async () => {
    busca.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.animal(1)).rejects.toMatchObject({ status: 0, message: expect.stringContaining("conexão") });
  });

  it("envia a foto como multipart, sem escrever o Content-Type na mão", async () => {
    busca.mockResolvedValue(resposta(200, { url: "/x" }));
    const arquivo = new File(["abc"], "bidu.jpg", { type: "image/jpeg" });
    await api.enviarFoto("tok", 5, arquivo, { autor: "Ana", licenca: "CC BY 4.0", fonte: "https://x.org/a" });

    const [url, opcoes] = busca.mock.calls[0];
    expect(url).toBe("/api/v1/animais/5/foto?autor=Ana&licenca=CC+BY+4.0&fonte=https%3A%2F%2Fx.org%2Fa");
    expect(opcoes.method).toBe("PUT");
    expect(opcoes.headers).toEqual({ Authorization: "Bearer tok" });
    expect((opcoes.body as FormData).get("arquivo")).toBeInstanceOf(File);
  });

  it("envia a foto sem query quando não há crédito", async () => {
    busca.mockResolvedValue(resposta(200, {}));
    await api.enviarFoto("tok", 5, new File(["a"], "a.png"));
    expect(busca.mock.calls[0][0]).toBe("/api/v1/animais/5/foto");
  });

  it("chama cada endpoint no caminho e verbo certos", async () => {
    busca.mockImplementation(async () => resposta(200, {}));
    const chamadas: Array<[() => Promise<unknown>, string, string]> = [
      [() => api.eventos(4), "GET", "/api/v1/animais/4/eventos"],
      [() => api.candidatar(4, {}), "POST", "/api/v1/animais/4/candidaturas"],
      [() => api.atualizarAnimal("t", 4, {}), "PUT", "/api/v1/animais/4"],
      [() => api.suspender("t", 4), "POST", "/api/v1/animais/4/suspensao"],
      [() => api.reativar("t", 4), "POST", "/api/v1/animais/4/reativacao"],
      [() => api.registrarEvento("t", 4, {}), "POST", "/api/v1/animais/4/eventos"],
      [() => api.animaisDoAbrigo("t", { status: "ADOTADO" }), "GET", "/api/v1/painel/animais?status=ADOTADO&size=24&page=0"],
      [() => api.animaisDoAbrigo("t"), "GET", "/api/v1/painel/animais?size=24&page=0"],
      [() => api.resumo("t"), "GET", "/api/v1/painel/resumo"],
      [() => api.especies("t"), "GET", "/api/v1/painel/especies"],
      [() => api.adocoesPorMes("t"), "GET", "/api/v1/painel/adocoes-por-mes?meses=12"],
      [() => api.adocoesPorMes("t", 6), "GET", "/api/v1/painel/adocoes-por-mes?meses=6"],
      [() => api.candidaturas("t"), "GET", "/api/v1/candidaturas?size=50"],
      [() => api.candidaturas("t", "APROVADA"), "GET", "/api/v1/candidaturas?size=50&status=APROVADA"],
      [() => api.candidaturasDoAnimal("t", 4), "GET", "/api/v1/animais/4/candidaturas"],
      [() => api.analisar("t", 9), "POST", "/api/v1/candidaturas/9/analise"],
      [() => api.aprovar("t", 9), "POST", "/api/v1/candidaturas/9/aprovacao"],
      [() => api.recusar("t", 9, "sem tela"), "POST", "/api/v1/candidaturas/9/recusa"],
      [() => api.concluirAdocao("t", 9), "POST", "/api/v1/candidaturas/9/adocao"],
      [() => api.removerFoto("t", 4), "DELETE", "/api/v1/animais/4/foto"],
      [() => api.devolver("t", 4), "POST", "/api/v1/animais/4/devolucao"],
      [() => api.devolver("t", 4, "não se adaptou"), "POST", "/api/v1/animais/4/devolucao?motivo=n%C3%A3o%20se%20adaptou"]
    ];

    for (const [chamar, metodo, caminho] of chamadas) {
      busca.mockClear();
      await chamar();
      expect([busca.mock.calls[0][1].method, busca.mock.calls[0][0]]).toEqual([metodo, caminho]);
    }
  });
});
