import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adiada, gravarSessaoDeTeste, navegacao, pagina, umAnimal, umPedido, umResumo } from "../fixtures";

vi.mock("next/navigation", async () => {
  const { navegacao } = await import("../fixtures");
  return {
    useRouter: () => navegacao,
    useParams: () => ({ id: navegacao.id }),
    usePathname: () => navegacao.caminho,
    useSearchParams: () => navegacao.parametros
  };
});
vi.mock("@/lib/api", async (original) => {
  const real = await original<typeof import("@/lib/api")>();
  const nomes = ["animaisDoAbrigo", "resumo", "especies", "adocoesPorMes", "cadastrarAnimal", "animal", "eventos",
                 "candidaturasDoAnimal", "atualizarAnimal", "excluirAnimal", "suspender", "reativar", "concluirAdocao",
                 "devolver", "aprovar", "analisar", "recusar", "candidaturas", "enviarFoto", "removerFoto"];
  return { ...real, api: Object.fromEntries(nomes.map((nome) => [nome, vi.fn()])) };
});

import PainelLayout from "@/app/painel/layout";
import Painel from "@/app/painel/page";
import NovoAnimal from "@/app/painel/novo/page";
import GerenciarAnimal from "@/app/painel/[id]/page";
import Candidaturas from "@/app/painel/candidaturas/page";
import { api, ErroDaApi } from "@/lib/api";
import { limparSessao } from "@/lib/sessao";

const chamadas = vi.mocked(api);

beforeEach(() => {
  Object.values(chamadas).forEach((mock) => mock.mockReset());
  navegacao.push.mockReset();
  navegacao.replace.mockReset();
  navegacao.caminho = "/painel";
  navegacao.parametros = new URLSearchParams();
  navegacao.id = "7";
  gravarSessaoDeTeste();
});

describe("layout do painel", () => {
  it("confere a sessão antes de mostrar qualquer coisa", () => {
    limparSessao();
    render(<PainelLayout><p>conteúdo</p></PainelLayout>);
    expect(screen.getByText("Conferindo a sessão")).toBeInTheDocument();
    expect(screen.queryByText("conteúdo")).toBeNull();
    expect(navegacao.replace).toHaveBeenCalledWith("/entrar");
  });

  it("marca a página atual e sai", async () => {
    const usuario = userEvent.setup();
    navegacao.caminho = "/painel/candidaturas";
    render(<PainelLayout><p>conteúdo</p></PainelLayout>);

    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Abrigo São Francisco")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Acervo" })).not.toHaveAttribute("aria-current");

    await usuario.click(screen.getByRole("button", { name: "Sair" }));
    expect(navegacao.replace).toHaveBeenCalledWith("/");
  });
});

describe("acervo", () => {
  function responder() {
    chamadas.resumo.mockResolvedValue(umResumo());
    chamadas.especies.mockResolvedValue([{ especie: "CACHORRO", rotulo: "Cachorro", quantidade: 14 }]);
    chamadas.adocoesPorMes.mockResolvedValue([{ mes: "2026-09-01", quantidade: 2 }]);
    chamadas.animaisDoAbrigo.mockResolvedValue(pagina([
      umAnimal(), umAnimal({ id: 8, nome: "Tico", raca: undefined, especieRotulo: "Pássaro", sexoRotulo: "Macho" })
    ]));
  }

  it("mostra resumo, gráficos e a lista com link para cada ficha", async () => {
    responder();
    render(<Painel />);

    expect(await screen.findByText("pedidos esperando resposta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Responder/ })).toHaveAttribute("href", "/painel/candidaturas");
    expect(screen.getByRole("heading", { name: "Adoções por mês" })).toBeInTheDocument();
    const linhas = await screen.findAllByRole("link", { name: /Estrela|Tico/ });
    expect(linhas[0]).toHaveAttribute("href", "/painel/7");
    expect(screen.getByText("Pássaro, macho, 5 anos")).toBeInTheDocument();
    expect(chamadas.adocoesPorMes).toHaveBeenCalledWith("tok", 12);
  });

  it("fala no singular e some com o botão quando não há pedido", async () => {
    responder();
    chamadas.resumo.mockResolvedValueOnce(umResumo({ candidaturasEmAberto: 1 }));
    const { unmount } = render(<Painel />);
    expect(await screen.findByText("pedido esperando resposta")).toBeInTheDocument();
    unmount();

    chamadas.resumo.mockResolvedValueOnce(umResumo({ candidaturasEmAberto: 0 }));
    render(<Painel />);
    expect(await screen.findByText("Nenhum pedido esperando resposta.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Responder/ })).toBeNull();
  });

  it("filtra por situação e busca, e limpa os filtros quando nada aparece", async () => {
    responder();
    const usuario = userEvent.setup();
    render(<Painel />);
    await screen.findAllByRole("link", { name: /Estrela/ });

    chamadas.animaisDoAbrigo.mockResolvedValue(pagina([]));
    await usuario.click(screen.getByRole("button", { name: "Adotados" }));
    await waitFor(() => expect(chamadas.animaisDoAbrigo).toHaveBeenLastCalledWith("tok",
      { status: "ADOTADO", busca: undefined, tamanho: 50 }));

    await usuario.type(screen.getByLabelText("Buscar no acervo"), " bidu {enter}");
    await waitFor(() => expect(chamadas.animaisDoAbrigo).toHaveBeenLastCalledWith("tok",
      { status: "ADOTADO", busca: "bidu", tamanho: 50 }));
    expect(await screen.findByText("Nenhum animal com esses filtros.")).toBeInTheDocument();

    chamadas.animaisDoAbrigo.mockResolvedValue(pagina([umAnimal()]));
    await usuario.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(chamadas.animaisDoAbrigo).toHaveBeenLastCalledWith("tok",
      { status: undefined, busca: undefined, tamanho: 50 }));
    expect(screen.getByLabelText("Buscar no acervo")).toHaveValue("");
  });

  it("acervo vazio convida a cadastrar o primeiro", async () => {
    responder();
    chamadas.animaisDoAbrigo.mockResolvedValue(pagina([]));
    render(<Painel />);
    expect(await screen.findByText("Nenhum animal cadastrado ainda. Comece pelo primeiro.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Cadastrar animal" })).toHaveLength(2);
  });

  it("mostra carregando e os erros do resumo e da lista", async () => {
    const lista = adiada<ReturnType<typeof pagina>>();
    chamadas.animaisDoAbrigo.mockReturnValue(lista.promessa as never);
    chamadas.resumo.mockRejectedValue(new ErroDaApi("Token expirado", 401));
    chamadas.especies.mockResolvedValue([]);
    chamadas.adocoesPorMes.mockResolvedValue([]);
    const { unmount } = render(<Painel />);

    expect(screen.getByText("Carregando")).toBeInTheDocument();
    expect(await screen.findByText("Token expirado")).toBeInTheDocument();
    await act(async () => lista.rejeitar(new ErroDaApi("Falhou a lista", 500)));
    expect(await screen.findByText("Falhou a lista")).toBeInTheDocument();
    unmount();

    chamadas.resumo.mockRejectedValue(new Error("rede"));
    chamadas.animaisDoAbrigo.mockResolvedValue(pagina([]));
    const { unmount: desmontar } = render(<Painel />);
    expect(await screen.findByText("O resumo do abrigo não carregou.")).toBeInTheDocument();
    desmontar();

    responder();
    chamadas.animaisDoAbrigo.mockRejectedValue(new Error("rede"));
    render(<Painel />);
    expect(await screen.findByText("A lista de animais não carregou.")).toBeInTheDocument();
  });

  it("sem sessão não chama a API", () => {
    limparSessao();
    render(<Painel />);
    expect(chamadas.resumo).not.toHaveBeenCalled();
    expect(chamadas.animaisDoAbrigo).not.toHaveBeenCalled();
  });
});

describe("cadastro de animal", () => {
  it("salva e abre a ficha nova já pedindo a foto", async () => {
    const usuario = userEvent.setup();
    chamadas.cadastrarAnimal.mockResolvedValue(umAnimal({ id: 40 }));
    render(<NovoAnimal />);

    expect(screen.getByText("Sem nome ainda")).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Nome"), "Farofa");
    await usuario.type(screen.getByLabelText("Raça"), " Vira-lata ");
    expect(screen.getByText("Farofa")).toBeInTheDocument();
    expect(screen.getByText(", Vira-lata")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Salvar e seguir para a foto" }));
    await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/painel/40?novo=sim"));
    expect(chamadas.cadastrarAnimal).toHaveBeenCalledWith("tok", expect.objectContaining({ nome: "Farofa", raca: "Vira-lata" }));
  });

  it("marca campos reprovados, mostra erro geral e falha de rede", async () => {
    const usuario = userEvent.setup();
    render(<NovoAnimal />);

    chamadas.cadastrarAnimal.mockRejectedValueOnce(new ErroDaApi("Dados inválidos", 400, { nome: "todo animal precisa de um nome" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar e seguir para a foto" }));
    expect(await screen.findByText("todo animal precisa de um nome")).toBeInTheDocument();
    expect(screen.getByText("Confira os campos marcados.")).toBeInTheDocument();

    chamadas.cadastrarAnimal.mockRejectedValueOnce(new ErroDaApi("Abrigo não encontrado", 404));
    await usuario.click(screen.getByRole("button", { name: "Salvar e seguir para a foto" }));
    expect(await screen.findByText("Abrigo não encontrado")).toBeInTheDocument();

    chamadas.cadastrarAnimal.mockRejectedValueOnce(new Error("rede"));
    await usuario.click(screen.getByRole("button", { name: "Salvar e seguir para a foto" }));
    expect(await screen.findByText("O cadastro não foi salvo. Tente de novo.")).toBeInTheDocument();
  });

  it("sem sessão não envia", async () => {
    const usuario = userEvent.setup();
    render(<NovoAnimal />);
    limparSessao();
    await usuario.click(screen.getByRole("button", { name: "Salvar e seguir para a foto" }));
    expect(chamadas.cadastrarAnimal).not.toHaveBeenCalled();
  });
});

describe("gerenciar animal", () => {
  function responder(animal = umAnimal(), pedidos = [umPedido()]) {
    chamadas.animal.mockResolvedValue(animal);
    chamadas.eventos.mockResolvedValue([
      { tipo: "ENTRADA", tipoRotulo: "Entrada no abrigo", descricao: "Entrada no abrigo", acontecido: "2025-10-10" },
      { tipo: "VACINA", tipoRotulo: "Vacina", descricao: "V10", acontecido: "2025-11-10" }
    ]);
    chamadas.candidaturasDoAnimal.mockResolvedValue(pedidos);
  }

  it("mostra foto, cadastro, situação, pedidos em aberto e linha do tempo", async () => {
    responder(umAnimal(), [umPedido(), umPedido({ id: 32, status: "RECUSADA", nome: "Carlos" }),
                           umPedido({ id: 33, status: "EM_ANALISE", nome: "Luiza", cidade: undefined, moradiaRotulo: undefined })]);
    render(<GerenciarAnimal />);

    expect(screen.getByText("Carregando a ficha")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1, name: "Estrela" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Estrela");
    expect(screen.getByRole("heading", { name: "Foto" })).toBeInTheDocument();
    expect(screen.getByText("Aparece no catálogo e recebe pedidos.")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("Luiza")).toBeInTheDocument();
    expect(screen.queryByText("Carlos")).toBeNull();
    expect(screen.getByText("V10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver como o público vê" })).toHaveAttribute("href", "/animal/7");
  });

  it("avisa que falta a foto quando acabou de ser cadastrado", async () => {
    navegacao.parametros = new URLSearchParams("novo=sim");
    responder(umAnimal({ foto: undefined }), []);
    render(<GerenciarAnimal />);
    expect(await screen.findByText("Animal cadastrado. Agora falta a foto.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pedidos em aberto" })).toBeNull();
  });

  it("salva alterações e mostra o erro de campo quando reprovado", async () => {
    const usuario = userEvent.setup();
    responder();
    render(<GerenciarAnimal />);
    await screen.findByLabelText("Nome");

    chamadas.atualizarAnimal.mockRejectedValueOnce(new ErroDaApi("Dados inválidos", 400, { pesoEmGramas: "peso fora da faixa" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("peso fora da faixa")).toBeInTheDocument();
    expect(screen.getByText("Confira os campos marcados.")).toBeInTheDocument();

    chamadas.atualizarAnimal.mockResolvedValueOnce(umAnimal());
    await usuario.clear(screen.getByLabelText("Nome"));
    await usuario.type(screen.getByLabelText("Nome"), "Estrelinha");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Cadastro atualizado.")).toBeInTheDocument();
    expect(chamadas.atualizarAnimal).toHaveBeenLastCalledWith("tok", "7", expect.objectContaining({ nome: "Estrelinha" }));
    expect(chamadas.atualizarAnimal.mock.lastCall![2]).not.toHaveProperty("dataDeEntrada");
  });

  it.each([
    ["DISPONIVEL", "Tirar do catálogo", "suspender", "Tirado do catálogo."],
    ["INDISPONIVEL", "Voltar ao catálogo", "reativar", "De volta ao catálogo."],
    ["ADOTADO", "Registrar devolução", "devolver", "Devolução registrada."]
  ] as const)("com o animal %s oferece \"%s\"", async (status, botao, metodo, recado) => {
    const usuario = userEvent.setup();
    responder(umAnimal({ status, statusRotulo: status }), []);
    chamadas[metodo].mockResolvedValue(umAnimal() as never);
    render(<GerenciarAnimal />);

    await usuario.click(await screen.findByRole("button", { name: botao }));
    expect(await screen.findByText(recado)).toBeInTheDocument();
    expect(chamadas[metodo]).toHaveBeenCalledWith("tok", 7, ...(metodo === "devolver" ? ["Devolvido ao abrigo"] : []));
  });

  it("em processo conclui a adoção com o pedido aprovado", async () => {
    const usuario = userEvent.setup();
    responder(umAnimal({ status: "EM_PROCESSO", statusRotulo: "Em processo" }),
              [umPedido({ id: 50, status: "APROVADA", nome: "Beatriz" })]);
    chamadas.concluirAdocao.mockResolvedValue(umPedido());
    render(<GerenciarAnimal />);

    expect(await screen.findByText("Reservado para Beatriz.")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Concluir adoção" }));
    expect(await screen.findByText("Adoção concluída.")).toBeInTheDocument();
    expect(chamadas.concluirAdocao).toHaveBeenCalledWith("tok", 50);
  });

  it("em processo sem pedido aprovado só descreve a situação", async () => {
    responder(umAnimal({ status: "EM_PROCESSO", statusRotulo: "Em processo" }), []);
    render(<GerenciarAnimal />);
    expect(await screen.findByText("Com adoção em andamento.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir adoção" })).toBeNull();
  });

  it("aprova um pedido em aberto direto da ficha", async () => {
    const usuario = userEvent.setup();
    responder();
    chamadas.aprovar.mockResolvedValue(umPedido());
    render(<GerenciarAnimal />);

    await usuario.click(await screen.findByRole("button", { name: "Aprovar" }));
    expect(await screen.findByText("Pedido de Maria Souza aprovado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ler o pedido" })).toHaveAttribute("href", "/painel/candidaturas");
  });

  it("mostra a mensagem da API quando a ação é recusada sem erro de campo", async () => {
    const usuario = userEvent.setup();
    responder();
    chamadas.suspender.mockRejectedValue(new ErroDaApi("Animal com adoção em andamento.", 422));
    render(<GerenciarAnimal />);
    await usuario.click(await screen.findByRole("button", { name: "Tirar do catálogo" }));
    expect(await screen.findByText("Animal com adoção em andamento.")).toBeInTheDocument();
  });

  it("ficha vazia vira aviso de não encontrado", async () => {
    chamadas.animal.mockResolvedValue(null as never);
    chamadas.eventos.mockResolvedValue([]);
    chamadas.candidaturasDoAnimal.mockResolvedValue([]);
    render(<GerenciarAnimal />);
    expect(await screen.findByText("Animal não encontrado.")).toBeInTheDocument();
  });

  it("mostra falha de ação que não veio da API", async () => {
    const usuario = userEvent.setup();
    responder();
    chamadas.suspender.mockRejectedValue(new Error("rede"));
    render(<GerenciarAnimal />);
    await usuario.click(await screen.findByRole("button", { name: "Tirar do catálogo" }));
    expect(await screen.findByText("A operação não foi concluída.")).toBeInTheDocument();
  });

  it("exclui só depois de confirmar, e volta ao acervo", async () => {
    const usuario = userEvent.setup();
    responder();
    chamadas.excluirAnimal.mockResolvedValue(undefined);
    render(<GerenciarAnimal />);

    await usuario.click(await screen.findByRole("button", { name: "Excluir animal" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(chamadas.excluirAnimal).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Excluir animal" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir Estrela de vez" }));
    await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/painel"));
    expect(chamadas.excluirAnimal).toHaveBeenCalledWith("tok", "7");
  });

  it("explica por que a exclusão foi recusada", async () => {
    const usuario = userEvent.setup();
    responder();
    render(<GerenciarAnimal />);

    chamadas.excluirAnimal.mockRejectedValueOnce(new ErroDaApi("Animal adotado não pode ser excluído.", 422));
    await usuario.click(await screen.findByRole("button", { name: "Excluir animal" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir Estrela de vez" }));
    expect(await screen.findByText("Animal adotado não pode ser excluído.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir animal" })).toBeEnabled();

    chamadas.excluirAnimal.mockRejectedValueOnce(new Error("rede"));
    await usuario.click(screen.getByRole("button", { name: "Excluir animal" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir Estrela de vez" }));
    expect(await screen.findByText("O cadastro não foi excluído.")).toBeInTheDocument();
  });

  it("atualiza a ficha depois que a foto muda", async () => {
    const usuario = userEvent.setup();
    responder();
    chamadas.removerFoto.mockResolvedValue(undefined);
    render(<GerenciarAnimal />);

    await usuario.click(await screen.findByRole("button", { name: "Remover foto" }));
    expect(await screen.findByText("Foto atualizada.")).toBeInTheDocument();
    expect(chamadas.animal).toHaveBeenCalledTimes(2);
  });

  it("explica quando a ficha não carrega", async () => {
    chamadas.animal.mockRejectedValue(new ErroDaApi("Animal 7 não encontrado.", 404));
    chamadas.eventos.mockResolvedValue([]);
    chamadas.candidaturasDoAnimal.mockResolvedValue([]);
    const { unmount } = render(<GerenciarAnimal />);
    expect(await screen.findByText("Animal 7 não encontrado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao acervo" })).toHaveAttribute("href", "/painel");
    unmount();

    chamadas.animal.mockRejectedValue(new Error("rede"));
    render(<GerenciarAnimal />);
    expect(await screen.findByText("A ficha não carregou.")).toBeInTheDocument();
  });

  it("sem sessão não carrega nem executa", async () => {
    responder();
    const usuario = userEvent.setup();
    render(<GerenciarAnimal />);
    await screen.findByRole("heading", { level: 1, name: "Estrela" });

    limparSessao();
    await usuario.click(screen.getByRole("button", { name: "Tirar do catálogo" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir animal" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir Estrela de vez" }));
    expect(chamadas.suspender).not.toHaveBeenCalled();
    expect(chamadas.excluirAnimal).not.toHaveBeenCalled();
  });

  it("sem sessão desde o início fica carregando", () => {
    limparSessao();
    render(<GerenciarAnimal />);
    expect(chamadas.animal).not.toHaveBeenCalled();
    expect(screen.getByText("Carregando a ficha")).toBeInTheDocument();
  });
});

describe("pedidos de adoção", () => {
  it("lista com contato, casa e mensagem, e filtra por situação", async () => {
    const usuario = userEvent.setup();
    chamadas.candidaturas.mockResolvedValue(pagina([
      umPedido(),
      umPedido({ id: 32, nome: "João", moradia: "CASA", moradiaRotulo: "Casa", areaProtegida: false, temOutrosAnimais: true,
                 email: undefined, telefone: undefined, cidade: undefined, mensagem: undefined, status: "RECUSADA",
                 statusRotulo: "Recusada", motivoDaRecusa: "Sem cerca" })
    ]));
    render(<Candidaturas />);

    const maria = await screen.findByRole("article", { name: "Maria Souza" });
    expect(within(maria).getByRole("link", { name: "maria@exemplo.com" })).toHaveAttribute("href", "mailto:maria@exemplo.com");
    expect(within(maria).getByText("Com tela ou muro")).toBeInTheDocument();
    expect(within(maria).getByText("Sem outros animais")).toBeInTheDocument();
    expect(within(maria).getByText("Tenho tela em todas as janelas.")).toBeInTheDocument();
    expect(within(maria).getByRole("link", { name: "Estrela" })).toHaveAttribute("href", "/painel/7");

    const joao = screen.getByRole("article", { name: "João" });
    expect(within(joao).getByText("Sem tela ou muro")).toBeInTheDocument();
    expect(within(joao).getByText("Motivo da recusa: Sem cerca")).toBeInTheDocument();
    expect(within(joao).queryByRole("button")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Aprovados" }));
    await waitFor(() => expect(chamadas.candidaturas).toHaveBeenLastCalledWith("tok", "APROVADA"));
  });

  it("aprova, coloca em análise e conclui a adoção", async () => {
    const usuario = userEvent.setup();
    chamadas.candidaturas.mockResolvedValue(pagina([umPedido(), umPedido({ id: 40, nome: "Rafael", status: "APROVADA",
                                                                           statusRotulo: "Aprovada" })]));
    chamadas.aprovar.mockResolvedValue(umPedido());
    chamadas.analisar.mockResolvedValue(umPedido());
    chamadas.concluirAdocao.mockResolvedValue(umPedido());
    render(<Candidaturas />);

    const maria = await screen.findByRole("article", { name: "Maria Souza" });
    await usuario.click(within(maria).getByRole("button", { name: "Marcar em análise" }));
    expect(await screen.findByText("Pedido marcado como em análise.")).toBeInTheDocument();
    await usuario.click(within(maria).getByRole("button", { name: "Aprovar" }));
    expect(await screen.findByText("Pedido de Maria Souza aprovado. Estrela ficou reservado.")).toBeInTheDocument();

    await usuario.click(within(screen.getByRole("article", { name: "Rafael" })).getByRole("button", { name: "Concluir adoção" }));
    expect(await screen.findByText("Adoção de Estrela concluída.")).toBeInTheDocument();
    expect(chamadas.concluirAdocao).toHaveBeenCalledWith("tok", 40);
  });

  it("recusa só com motivo, e dá para desistir", async () => {
    const usuario = userEvent.setup();
    chamadas.candidaturas.mockResolvedValue(pagina([umPedido({ status: "EM_ANALISE", statusRotulo: "Em análise" })]));
    render(<Candidaturas />);

    await usuario.click(await screen.findByRole("button", { name: "Recusar" }));
    expect(screen.queryByRole("button", { name: "Marcar em análise" })).toBeNull();
    expect(screen.getByRole("button", { name: "Confirmar recusa" })).toBeDisabled();
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByLabelText("Motivo da recusa")).toBeNull();

    chamadas.recusar.mockRejectedValueOnce(new ErroDaApi("Pedido já foi respondido.", 422));
    await usuario.click(screen.getByRole("button", { name: "Recusar" }));
    await usuario.type(screen.getByLabelText("Motivo da recusa"), "  precisa de quintal ");
    await usuario.click(screen.getByRole("button", { name: "Confirmar recusa" }));
    expect(await screen.findByText("Pedido já foi respondido.")).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo da recusa")).toBeInTheDocument();

    chamadas.recusar.mockResolvedValueOnce(umPedido());
    await usuario.click(screen.getByRole("button", { name: "Confirmar recusa" }));
    expect(await screen.findByText("Pedido recusado.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo da recusa")).toBeNull();
    expect(chamadas.recusar).toHaveBeenLastCalledWith("tok", 31, "precisa de quintal");
  });

  it("mostra vazio geral, vazio filtrado, carregando e erros", async () => {
    const usuario = userEvent.setup();
    const primeira = adiada<ReturnType<typeof pagina>>();
    chamadas.candidaturas.mockReturnValueOnce(primeira.promessa as never);
    render(<Candidaturas />);

    expect(screen.getByText("Carregando")).toBeInTheDocument();
    await act(async () => primeira.resolver(pagina([])));
    expect(screen.getByText(/Nenhum pedido ainda/)).toBeInTheDocument();

    chamadas.candidaturas.mockResolvedValue(pagina([]));
    await usuario.click(screen.getByRole("button", { name: "Recusados" }));
    expect(await screen.findByText("Nenhum pedido nessa situação.")).toBeInTheDocument();

    chamadas.candidaturas.mockRejectedValueOnce(new ErroDaApi("Token expirado", 401));
    await usuario.click(screen.getByRole("button", { name: "Novos" }));
    expect(await screen.findByText("Token expirado")).toBeInTheDocument();

    chamadas.candidaturas.mockRejectedValueOnce(new Error("rede"));
    await usuario.click(screen.getByRole("button", { name: "Em análise" }));
    expect(await screen.findByText("Os pedidos não carregaram.")).toBeInTheDocument();
  });

  it("mostra falha de ação desconhecida e não age sem sessão", async () => {
    const usuario = userEvent.setup();
    chamadas.candidaturas.mockResolvedValue(pagina([umPedido()]));
    chamadas.aprovar.mockRejectedValueOnce(new Error("rede"));
    render(<Candidaturas />);

    await usuario.click(await screen.findByRole("button", { name: "Aprovar" }));
    expect(await screen.findByText("A operação não foi concluída.")).toBeInTheDocument();

    limparSessao();
    await usuario.click(screen.getByRole("button", { name: "Aprovar" }));
    expect(chamadas.aprovar).toHaveBeenCalledTimes(1);
  });

  it("sem sessão não busca pedidos", () => {
    limparSessao();
    render(<Candidaturas />);
    expect(chamadas.candidaturas).not.toHaveBeenCalled();
  });
});
