import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adiada, gravarSessaoDeTeste, navegacao, pagina, umAnimal } from "../fixtures";

vi.mock("next/navigation", async () => {
  const { navegacao } = await import("../fixtures");
  return { useRouter: () => navegacao, useParams: () => ({ id: navegacao.id }) };
});
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "fonte-fraunces" }),
  Geist: () => ({ variable: "fonte-geist" })
}));
vi.mock("@/components/PlaquinhaDeColeira", () => ({
  default: ({ nome }: { nome: string }) => <div data-testid="plaquinha">{nome}</div>
}));
vi.mock("@/lib/api", async (original) => {
  const real = await original<typeof import("@/lib/api")>();
  return {
    ...real,
    api: { animal: vi.fn(), eventos: vi.fn(), candidatar: vi.fn(), catalogo: vi.fn(), registrar: vi.fn(), entrar: vi.fn(),
           eu: vi.fn() }
  };
});

import RootLayout, { metadata } from "@/app/layout";
import FichaDoAnimal from "@/app/animal/[id]/page";
import Entrar from "@/app/entrar/page";
import { api, ErroDaApi } from "@/lib/api";
import { lerSessao } from "@/lib/sessao";

const chamadas = vi.mocked(api);

describe("layout raiz", () => {
  it("declara idioma, fontes e título", () => {
    const arvore = RootLayout({ children: <p>oi</p> });
    expect(arvore.props.lang).toBe("pt-BR");
    expect(arvore.props.className).toBe("fonte-fraunces fonte-geist");
    expect(metadata.title).toBe("Guarida · adoção de animais");
  });
});

describe("ficha pública do animal", () => {
  beforeEach(() => {
    Object.values(chamadas).forEach((mock) => mock.mockReset());
    navegacao.id = "7";
  });

  it("mostra foto, crédito, dados, cuidados, jeito, saúde e linha do tempo", async () => {
    chamadas.animal.mockResolvedValue(umAnimal());
    chamadas.eventos.mockResolvedValue([
      { tipo: "ENTRADA", tipoRotulo: "Entrada no abrigo", descricao: "Entrada no abrigo", acontecido: "2025-10-10" },
      { tipo: "VACINA", tipoRotulo: "Vacina", descricao: "V10, primeira dose", acontecido: "2025-11-01" }
    ]);
    render(<FichaDoAnimal />);

    expect(screen.getByText("Carregando a ficha")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1, name: "Estrela" })).toBeInTheDocument();
    expect(chamadas.animal).toHaveBeenCalledWith("7");
    expect(screen.getByText("Foto de Sturm")).toBeInTheDocument();
    expect(screen.getByText("19 kg")).toBeInTheDocument();
    expect(screen.getByText("Vacinado")).toBeInTheDocument();
    expect(screen.getByText("Castrado")).toBeInTheDocument();
    expect(screen.getByText("Vermífugo pendente")).toBeInTheDocument();
    expect(screen.getByText("Dócil")).toBeInTheDocument();
    expect(screen.getByText("Toma condroitina.")).toBeInTheDocument();
    expect(screen.getByText("V10, primeira dose")).toBeInTheDocument();
    expect(screen.getAllByText("Entrada no abrigo")).toHaveLength(1);
    expect(screen.getByTestId("plaquinha")).toHaveTextContent("Estrela");
    expect(screen.getByRole("heading", { name: "Quero adotar Estrela" })).toBeInTheDocument();
  });

  it("esconde o que o animal não tem e troca os textos dos cuidados", async () => {
    chamadas.animal.mockResolvedValue(umAnimal({ sexo: "MACHO", sexoRotulo: "Macho", raca: undefined, historia: undefined,
      observacoesDeSaude: undefined, temperamentos: [], vacinado: false, castrado: false, vermifugado: true }));
    chamadas.eventos.mockResolvedValue([]);
    render(<FichaDoAnimal />);

    expect(await screen.findByText("Sem raça definida")).toBeInTheDocument();
    expect(screen.getByText("Vacina pendente")).toBeInTheDocument();
    expect(screen.getByText("Não castrado")).toBeInTheDocument();
    expect(screen.getByText("Vermifugado")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Jeito de ser" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Saúde" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Linha do tempo" })).toBeNull();
  });

  it("ficha vazia vira aviso de não encontrado", async () => {
    chamadas.animal.mockResolvedValue(null as never);
    chamadas.eventos.mockResolvedValue([]);
    render(<FichaDoAnimal />);
    expect(await screen.findByText("Animal não encontrado.")).toBeInTheDocument();
  });

  it("explica quando a ficha não existe ou a rede falha", async () => {
    chamadas.animal.mockRejectedValue(new ErroDaApi("Animal 99 não encontrado.", 404));
    chamadas.eventos.mockResolvedValue([]);
    const { unmount } = render(<FichaDoAnimal />);
    expect(await screen.findByText("Animal 99 não encontrado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao catálogo" })).toHaveAttribute("href", "/");
    unmount();

    chamadas.animal.mockRejectedValue(new Error("rede"));
    render(<FichaDoAnimal />);
    expect(await screen.findByText("A ficha não carregou.")).toBeInTheDocument();
  });
});

describe("entrada do abrigo", () => {
  beforeEach(() => {
    Object.values(chamadas).forEach((mock) => mock.mockReset());
    navegacao.push.mockReset();
    navegacao.replace.mockReset();
    chamadas.catalogo.mockResolvedValue(pagina([umAnimal({ id: 1, foto: undefined }), umAnimal({ id: 2, nome: "Mel" })]));
  });

  it("quem já tem sessão vai direto ao painel", () => {
    gravarSessaoDeTeste();
    render(<Entrar />);
    expect(navegacao.replace).toHaveBeenCalledWith("/painel");
  });

  it("usa a foto de um animal adotado como capa, com crédito", async () => {
    render(<Entrar />);
    expect(await screen.findByRole("img", { name: "Mel, já adotado" })).toBeInTheDocument();
    expect(chamadas.catalogo).toHaveBeenCalledWith({ status: "ADOTADO", tamanho: 12 });
  });

  it("sem adotado com foto a capa fica vazia, e falha de rede não quebra", async () => {
    chamadas.catalogo.mockResolvedValue(pagina([umAnimal({ foto: undefined })]));
    const { container, unmount } = render(<Entrar />);
    await waitFor(() => expect(chamadas.catalogo).toHaveBeenCalled());
    expect(container.querySelector(".entrada-foto img")).toBeNull();
    unmount();

    chamadas.catalogo.mockRejectedValue(new Error("rede"));
    render(<Entrar />);
    expect(await screen.findByRole("heading", { name: "Bom te ver de volta." })).toBeInTheDocument();
  });

  it("entra com a conta de demonstração e grava a sessão", async () => {
    const usuario = userEvent.setup();
    const token = adiada<{ token: string; tipo: string; expiraEm: string }>();
    chamadas.entrar.mockReturnValue(token.promessa);
    chamadas.eu.mockResolvedValue({ id: 1, nome: "Abrigo São Francisco", email: "abrigo@guarida.app", cidade: "Niterói" });
    render(<Entrar />);

    await usuario.click(screen.getByRole("button", { name: "Preencher com a conta de demonstração" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("abrigo@guarida.app");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("button", { name: "Um instante" })).toBeDisabled();

    await act(async () => token.resolver({ token: "jwt", tipo: "Bearer", expiraEm: "2099-01-01T00:00:00Z" }));
    await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/painel"));
    expect(chamadas.entrar).toHaveBeenCalledWith({ email: "abrigo@guarida.app", senha: "demonstracao2026" });
    expect(chamadas.registrar).not.toHaveBeenCalled();
    expect(lerSessao()).toMatchObject({ token: "jwt", nome: "Abrigo São Francisco" });
  });

  it("cria a conta antes de entrar e manda telefone vazio como ausente", async () => {
    const usuario = userEvent.setup();
    chamadas.registrar.mockResolvedValue({ id: 2, nome: "Abrigo Novo" });
    chamadas.entrar.mockResolvedValue({ token: "jwt", tipo: "Bearer", expiraEm: "2099-01-01T00:00:00Z" });
    chamadas.eu.mockResolvedValue({ id: 2, nome: "Abrigo Novo", email: "novo@x.org", cidade: "Maricá" });
    render(<Entrar />);

    await usuario.click(screen.getByRole("tab", { name: "Criar conta" }));
    expect(screen.getByRole("heading", { name: "Cadastre o seu abrigo." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /demonstração/ })).toBeNull();
    expect(screen.getByText("No mínimo 8 caracteres")).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Nome do abrigo"), "Abrigo Novo");
    await usuario.type(screen.getByLabelText("Cidade"), "Maricá");
    await usuario.type(screen.getByLabelText("E-mail"), "novo@x.org");
    await usuario.type(screen.getByLabelText("Senha"), "segredo123");
    await usuario.click(screen.getByRole("button", { name: "Criar conta e entrar" }));

    await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/painel"));
    expect(chamadas.registrar).toHaveBeenCalledWith({ nome: "Abrigo Novo", email: "novo@x.org", senha: "segredo123",
                                                     cidade: "Maricá", telefone: undefined });

    // depois do sucesso o botão fica ocupado até a navegação terminar, para não criar a conta duas vezes
    expect(screen.getByRole("button", { name: "Um instante" })).toBeDisabled();
  });

  it("manda o telefone quando preenchido", async () => {
    const usuario = userEvent.setup();
    chamadas.registrar.mockRejectedValue(new ErroDaApi("E-mail já cadastrado.", 409));
    render(<Entrar />);

    await usuario.click(screen.getByRole("tab", { name: "Criar conta" }));
    await usuario.type(screen.getByLabelText("Telefone"), "21999998888");
    await usuario.click(screen.getByRole("button", { name: "Criar conta e entrar" }));
    expect(await screen.findByText("E-mail já cadastrado.")).toBeInTheDocument();
    expect(chamadas.registrar).toHaveBeenCalledWith(expect.objectContaining({ telefone: "21999998888" }));
    expect(chamadas.entrar).not.toHaveBeenCalled();
  });

  it("mostra erro de campo, erro geral e falha desconhecida, e limpa ao trocar de aba", async () => {
    const usuario = userEvent.setup();
    render(<Entrar />);

    chamadas.entrar.mockRejectedValueOnce(new ErroDaApi("Dados inválidos", 400, { email: "informe o e-mail" }));
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("informe o e-mail")).toBeInTheDocument();
    expect(screen.getByText("Confira os campos marcados.")).toBeInTheDocument();

    chamadas.entrar.mockRejectedValueOnce(new ErroDaApi("E-mail ou senha não conferem.", 401));
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("E-mail ou senha não conferem.")).toBeInTheDocument();

    chamadas.entrar.mockRejectedValueOnce(new Error("rede"));
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Algo saiu do previsto. Tente de novo.")).toBeInTheDocument();

    await usuario.click(screen.getByRole("tab", { name: "Criar conta" }));
    expect(screen.queryByRole("alert")).toBeNull();
    await usuario.click(screen.getByRole("tab", { name: "Entrar" }));
    expect(screen.getByRole("tab", { name: "Entrar" })).toHaveAttribute("aria-selected", "true");
  });
});
