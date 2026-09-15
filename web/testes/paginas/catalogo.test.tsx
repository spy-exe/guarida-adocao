import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adiada, navegacao, pagina, umAnimal } from "../fixtures";

vi.mock("next/navigation", async () => {
  const { navegacao } = await import("../fixtures");
  return { useRouter: () => navegacao, useSearchParams: () => navegacao.parametros };
});
vi.mock("@/components/PlaquinhaDeColeira", () => ({ default: () => <div data-testid="plaquinha" /> }));
vi.mock("@/lib/api", async (original) => {
  const real = await original<typeof import("@/lib/api")>();
  return { ...real, api: { catalogo: vi.fn() } };
});

import PaginaInicial from "@/app/page";
import { api, ErroDaApi } from "@/lib/api";

const catalogo = vi.mocked(api.catalogo);

const bidu = umAnimal({ id: 1, nome: "Bidu", dataDeEntrada: "2026-01-01" });
const lola = umAnimal({ id: 2, nome: "Lola", dataDeEntrada: "2025-02-01" });
const semFoto = umAnimal({ id: 3, nome: "Kira", foto: undefined, dataDeEntrada: "2024-01-01" });
const tico = umAnimal({ id: 4, nome: "Tico", dataDeEntrada: "2025-06-01" });
const rex = umAnimal({ id: 5, nome: "Rex", dataDeEntrada: "2025-08-01" });

function responderPadrao() {
  catalogo.mockImplementation(async (filtros = {}) => {
    if (filtros.status === "ADOTADO") return pagina([], 4);
    if (filtros.tamanho === 60) return pagina([bidu, lola, semFoto, tico, rex], 22);
    return pagina([bidu, lola], 2);
  });
}

describe("catálogo público", () => {
  beforeEach(() => {
    catalogo.mockReset();
    navegacao.replace.mockReset();
    navegacao.parametros = new URLSearchParams();
  });

  it("mostra quem espera, os números e destaca quem está há mais tempo com foto", async () => {
    responderPadrao();
    const { container } = render(<PaginaInicial />);

    expect(await screen.findByRole("heading", { name: "Esperando casa" })).toBeInTheDocument();
    expect(await screen.findByText("2 animais encontrados")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Bidu/ }).length).toBeGreaterThan(0);

    await waitFor(() => expect(container.querySelectorAll(".mosaico-item img")).toHaveLength(3));
    const destaques = [...container.querySelectorAll(".mosaico-legenda strong")].map((n) => n.textContent);
    expect(destaques).toEqual(["Lola", "Tico", "Rex"]);
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(catalogo).toHaveBeenCalledWith({ especie: undefined, porte: undefined, apenasFilhotes: undefined,
                                            busca: undefined, status: "DISPONIVEL", tamanho: 24 });
  });

  it("mantém o esqueleto quando os destaques não carregam", async () => {
    catalogo.mockImplementation(async (filtros = {}) => {
      if (filtros.tamanho === 24) return pagina([bidu]);
      throw new Error("rede");
    });
    const { container } = render(<PaginaInicial />);
    expect(await screen.findByText("1 animal encontrado")).toBeInTheDocument();
    expect(container.querySelectorAll(".mosaico .esqueleto")).toHaveLength(3);
  });

  it("lê os filtros da URL e escreve de volta quando mudam", async () => {
    responderPadrao();
    navegacao.parametros = new URLSearchParams("especie=GATO&porte=GRANDE&filhotes=sim&busca=pérola");
    const usuario = userEvent.setup();
    render(<PaginaInicial />);

    expect(await screen.findByRole("heading", { name: "Resultados para “pérola”" })).toBeInTheDocument();
    expect(catalogo).toHaveBeenCalledWith(expect.objectContaining({ especie: "GATO", porte: "GRANDE",
                                                                    apenasFilhotes: true, busca: "pérola" }));
    expect(screen.getByRole("button", { name: "Gatos" })).toHaveAttribute("aria-pressed", "true");

    await usuario.click(screen.getByRole("button", { name: "Cães" }));
    expect(navegacao.replace).toHaveBeenLastCalledWith(
      "/?especie=CACHORRO&porte=GRANDE&filhotes=sim&busca=p%C3%A9rola", { scroll: false });

    await usuario.click(screen.getByRole("button", { name: "Filhotes" }));
    expect(navegacao.replace.mock.lastCall![0]).not.toContain("filhotes");

    await usuario.selectOptions(screen.getByLabelText("Porte"), "");
    expect(navegacao.replace.mock.lastCall![0]).not.toContain("porte");

    await usuario.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(navegacao.replace).toHaveBeenLastCalledWith("/", { scroll: false });
  });

  it("titula pela espécie escolhida e liga os filhotes", async () => {
    responderPadrao();
    navegacao.parametros = new URLSearchParams("especie=COELHO");
    const usuario = userEvent.setup();
    render(<PaginaInicial />);

    expect(await screen.findByRole("heading", { name: "Coelhos esperando casa" })).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Filhotes" }));
    expect(navegacao.replace.mock.lastCall![0]).toBe("/?especie=COELHO&filhotes=sim");
    await usuario.click(screen.getByRole("button", { name: "Todos" }));
    expect(navegacao.replace.mock.lastCall![0]).toBe("/?");
  });

  it("espécie desconhecida na URL cai no título geral", async () => {
    responderPadrao();
    navegacao.parametros = new URLSearchParams("especie=DRAGAO");
    render(<PaginaInicial />);
    expect(await screen.findByRole("heading", { name: "Esperando casa" })).toBeInTheDocument();
  });

  it("busca pelo texto aparado", async () => {
    responderPadrao();
    const usuario = userEvent.setup();
    render(<PaginaInicial />);

    await usuario.type(screen.getByLabelText("Buscar por nome, raça ou história"), "  caramelo ");
    await usuario.click(screen.getByRole("button", { name: "Buscar" }));
    expect(navegacao.replace).toHaveBeenLastCalledWith("/?busca=caramelo", { scroll: false });
  });

  it("mostra carregando, depois vazio com sugestão", async () => {
    const lista = adiada<ReturnType<typeof pagina>>();
    catalogo.mockImplementation((filtros = {}) => (filtros.tamanho === 24 ? lista.promessa : Promise.resolve(pagina([]))) as never);
    render(<PaginaInicial />);

    expect(screen.getByText("Procurando…")).toBeInTheDocument();
    expect(screen.getByText("Carregando")).toBeInTheDocument();
    await act(async () => lista.resolver(pagina([])));
    expect(screen.getByText(/Nenhum animal com esses filtros agora/)).toBeInTheDocument();
    expect(screen.getByText("0 animais encontrados")).toBeInTheDocument();
  });

  it("mostra o erro da API e uma mensagem própria para falha desconhecida", async () => {
    catalogo.mockRejectedValueOnce(new ErroDaApi("Parâmetro inválido", 400)).mockResolvedValue(pagina([]));
    const { unmount } = render(<PaginaInicial />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Parâmetro inválido");
    unmount();

    catalogo.mockReset();
    catalogo.mockRejectedValueOnce(new Error("x")).mockResolvedValue(pagina([]));
    render(<PaginaInicial />);
    expect(await screen.findByRole("alert")).toHaveTextContent("O catálogo não carregou.");
  });

  it("descarta resposta que chega depois de trocar o filtro", async () => {
    const primeira = adiada<ReturnType<typeof pagina>>();
    catalogo.mockImplementation((filtros = {}) => {
      if (filtros.tamanho !== 24) return Promise.resolve(pagina([])) as never;
      return (filtros.especie ? Promise.resolve(pagina([lola])) : primeira.promessa) as never;
    });
    const { rerender } = render(<PaginaInicial />);

    navegacao.parametros = new URLSearchParams("especie=CACHORRO");
    rerender(<PaginaInicial />);
    expect(await screen.findByText("1 animal encontrado")).toBeInTheDocument();

    await act(async () => primeira.resolver(pagina([bidu, lola, tico])));
    expect(screen.getByText("1 animal encontrado")).toBeInTheDocument();

    const falha = adiada<ReturnType<typeof pagina>>();
    catalogo.mockImplementation((filtros = {}) => (filtros.tamanho === 24 && filtros.especie === "GATO"
      ? falha.promessa : Promise.resolve(pagina([lola]))) as never);
    navegacao.parametros = new URLSearchParams("especie=GATO");
    rerender(<PaginaInicial />);
    navegacao.parametros = new URLSearchParams("especie=COELHO");
    rerender(<PaginaInicial />);
    await act(async () => falha.rejeitar(new Error("tarde demais")));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cada destaque do mosaico leva para a ficha", async () => {
    responderPadrao();
    const { container } = render(<PaginaInicial />);
    await waitFor(() => expect(container.querySelectorAll(".mosaico-item img")).toHaveLength(3));
    const primeiro = container.querySelector<HTMLAnchorElement>(".mosaico-item")!;
    expect(primeiro).toHaveAttribute("href", "/animal/2");
  });
});
