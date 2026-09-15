import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adiada, umAnimal, umPedido } from "../fixtures";

vi.mock("@/lib/api", async (original) => {
  const real = await original<typeof import("@/lib/api")>();
  return { ...real, api: { candidatar: vi.fn(), enviarFoto: vi.fn(), removerFoto: vi.fn() } };
});

import EnvioDeFoto, { problemaDoArquivo } from "@/components/EnvioDeFoto";
import FormularioDeAnimal, { corpoDaRequisicao, dadosIniciais, type DadosDoFormulario } from "@/components/FormularioDeAnimal";
import PedidoDeAdocao from "@/components/PedidoDeAdocao";
import { api, ErroDaApi } from "@/lib/api";

const chamadas = vi.mocked(api);

describe("dados do formulário de animal", () => {
  it("começa em branco com a entrada no dia de hoje", () => {
    const dados = dadosIniciais(undefined, new Date("2026-09-15T12:00:00Z"));
    expect(dados).toMatchObject({ nome: "", especie: "CACHORRO", sexo: "MACHO", porte: "MEDIO",
                                  dataDeEntrada: "2026-09-15", temperamentos: [] });
  });

  it("parte do animal existente na edição", () => {
    const dados = dadosIniciais(umAnimal({ raca: undefined, historia: undefined, observacoesDeSaude: undefined }));
    expect(dados).toMatchObject({ nome: "Estrela", raca: "", pesoEmGramas: "19000", dataDeEntrada: "2025-10-10",
                                  historia: "", observacoesDeSaude: "", temperamentos: ["DOCIL"], vermifugado: false });
  });

  it("apara texto, manda vazio como ausente e só inclui a entrada no cadastro", () => {
    const dados: DadosDoFormulario = { ...dadosIniciais(umAnimal()), nome: "  Estrela ", raca: " ", historia: "",
                                       observacoesDeSaude: "  ", nascimentoEstimado: "", pesoEmGramas: "" };
    const edicao = corpoDaRequisicao(dados, false);
    expect(edicao).toMatchObject({ nome: "Estrela", raca: undefined, historia: undefined, observacoesDeSaude: undefined,
                                   nascimentoEstimado: undefined, pesoEmGramas: undefined });
    expect(edicao).not.toHaveProperty("dataDeEntrada");

    expect(corpoDaRequisicao({ ...dados, pesoEmGramas: "4000" }, true)).toMatchObject({ pesoEmGramas: 4000,
                                                                                      dataDeEntrada: "2025-10-10" });
    expect(corpoDaRequisicao({ ...dados, dataDeEntrada: "" }, true)).toMatchObject({ dataDeEntrada: undefined });
  });
});

function FormularioControlado({ inicial, erros = {}, mostrarEntrada = true, espiao }:
  { inicial: DadosDoFormulario; erros?: Record<string, string>; mostrarEntrada?: boolean;
    espiao: (dados: DadosDoFormulario) => void }) {
  const [dados, setDados] = useState(inicial);
  return <FormularioDeAnimal dados={dados} erros={erros} mostrarEntrada={mostrarEntrada}
                             aoMudar={(novos) => { espiao(novos); setDados(novos); }} />;
}

describe("formulário de animal", () => {
  it("edita cada campo e alterna espécie, cuidados e traços", async () => {
    const usuario = userEvent.setup();
    const espiao = vi.fn();
    render(<FormularioControlado inicial={dadosIniciais()} espiao={espiao} />);

    await usuario.type(screen.getByLabelText("Nome"), "Bidu");
    await usuario.click(screen.getByRole("button", { name: "Gato" }));
    await usuario.type(screen.getByLabelText("Raça"), "SRD");
    await usuario.selectOptions(screen.getByLabelText("Sexo"), "FEMEA");
    await usuario.selectOptions(screen.getByLabelText("Porte"), "GRANDE");
    fireEvent.change(screen.getByLabelText("Nascimento estimado"), { target: { value: "2024-01-02" } });
    await usuario.type(screen.getByLabelText("Peso em gramas"), "4a0b00");
    fireEvent.change(screen.getByLabelText("Chegou ao abrigo em"), { target: { value: "2026-09-01" } });
    await usuario.click(screen.getByRole("button", { name: "Vacinado" }));
    await usuario.click(screen.getByRole("button", { name: "Castrado" }));
    await usuario.click(screen.getByRole("button", { name: "Vermifugado" }));
    await usuario.click(screen.getByRole("button", { name: "Calmo" }));
    await usuario.click(screen.getByRole("button", { name: "Tímido" }));
    await usuario.click(screen.getByRole("button", { name: "Calmo" }));
    await usuario.type(screen.getByLabelText("História"), "Veio da feira.");
    await usuario.type(screen.getByLabelText("Observações de saúde"), "Alergia");

    expect(espiao).toHaveBeenLastCalledWith(expect.objectContaining({
      nome: "Bidu", especie: "GATO", raca: "SRD", sexo: "FEMEA", porte: "GRANDE", nascimentoEstimado: "2024-01-02",
      pesoEmGramas: "4000", dataDeEntrada: "2026-09-01", vacinado: true, castrado: true, vermifugado: true,
      temperamentos: ["TIMIDO"], historia: "Veio da feira.", observacoesDeSaude: "Alergia"
    }));
    expect(screen.getByRole("button", { name: "Tímido" })).toHaveAttribute("aria-pressed", "true");
  });

  it("mostra os erros da API no campo certo e esconde a entrada na edição", () => {
    render(<FormularioControlado inicial={dadosIniciais()} mostrarEntrada={false} espiao={vi.fn()}
                                 erros={{ nome: "todo animal precisa de um nome", entradaDepoisDoNascimento: "datas trocadas",
                                          pesoEmGramas: "peso fora da faixa" }} />);
    expect(screen.getByText("todo animal precisa de um nome")).toBeInTheDocument();
    expect(screen.getByText("datas trocadas")).toBeInTheDocument();
    expect(screen.getByText("peso fora da faixa")).toBeInTheDocument();
    expect(screen.queryByLabelText("Chegou ao abrigo em")).toBeNull();
  });
});

describe("envio de foto", () => {
  beforeEach(() => {
    chamadas.enviarFoto.mockReset();
    chamadas.removerFoto.mockReset();
  });

  const arquivo = (tipo: string, tamanho = 10) => new File([new Uint8Array(tamanho)], "foto", { type: tipo });

  it("confere tipo e tamanho antes de gastar o envio", () => {
    expect(problemaDoArquivo(arquivo("image/gif"))).toMatch("JPEG, PNG ou WEBP");
    expect(problemaDoArquivo(arquivo("image/png", 2 * 1024 * 1024 + 1))).toMatch("2 MB");
    expect(problemaDoArquivo(arquivo("image/webp"))).toBeNull();
  });

  it("envia o arquivo escolhido com o crédito digitado", async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    const envio = adiada<never>();
    chamadas.enviarFoto.mockReturnValue(envio.promessa);
    const { container } = render(<EnvioDeFoto animal={umAnimal({ foto: undefined })} token="tok" aoMudar={aoMudar} />);

    expect(screen.getByText("Escolher ou arrastar uma foto")).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Autor da foto"), "Ana");
    await usuario.type(screen.getByLabelText("Licença"), "CC0");
    await usuario.type(screen.getByLabelText("Link da origem"), "https://x.org");
    const escolhido = arquivo("image/jpeg");
    await usuario.upload(screen.getByLabelText("Arquivo da foto"), escolhido);

    expect(chamadas.enviarFoto).toHaveBeenCalledWith("tok", 7, escolhido, { autor: "Ana", licenca: "CC0", fonte: "https://x.org" });
    expect(container.querySelector(".girando")).not.toBeNull();
    envio.resolver(undefined as never);
    await waitFor(() => expect(aoMudar).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /Remover/ })).toBeNull();
  });

  it("recusa arquivo errado sem chamar a API", async () => {
    render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Arquivo da foto"), { target: { files: [arquivo("application/pdf")] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("JPEG, PNG ou WEBP");
    expect(chamadas.enviarFoto).not.toHaveBeenCalled();
  });

  it("ignora a troca de arquivo sem arquivo", () => {
    render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Arquivo da foto"), { target: { files: [] } });
    expect(chamadas.enviarFoto).not.toHaveBeenCalled();
  });

  it("aceita arrastar e soltar, e marca a área enquanto arrasta", async () => {
    chamadas.enviarFoto.mockRejectedValue(new ErroDaApi("A foto pode ter no máximo 2 MB.", 422));
    const { container } = render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={vi.fn()} />);
    const area = container.querySelector(".soltar")!;

    fireEvent.dragOver(area);
    expect(area).toHaveAttribute("data-ativo", "sim");
    fireEvent.dragLeave(area);
    expect(area).not.toHaveAttribute("data-ativo");

    fireEvent.drop(area, { dataTransfer: { files: [] } });
    expect(chamadas.enviarFoto).not.toHaveBeenCalled();

    fireEvent.dragOver(area);
    fireEvent.drop(area, { dataTransfer: { files: [arquivo("image/png")] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("no máximo 2 MB");
    expect(area).not.toHaveAttribute("data-ativo");
  });

  it("explica falha que não veio da API", async () => {
    chamadas.enviarFoto.mockRejectedValue(new Error("rede"));
    render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Arquivo da foto"), { target: { files: [arquivo("image/png")] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("A foto não foi enviada.");
  });

  it("parte do crédito já gravado e remove a foto", async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    chamadas.removerFoto.mockResolvedValue(undefined);
    render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={aoMudar} />);

    expect(screen.getByLabelText("Autor da foto")).toHaveValue("Sturm");
    expect(screen.getByText("Trocar a foto")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Remover foto" }));
    expect(chamadas.removerFoto).toHaveBeenCalledWith("tok", 7);
    await waitFor(() => expect(aoMudar).toHaveBeenCalled());
  });

  it("mostra por que a remoção falhou", async () => {
    const usuario = userEvent.setup();
    chamadas.removerFoto.mockRejectedValueOnce(new ErroDaApi("Sem permissão", 403));
    const { rerender } = render(<EnvioDeFoto animal={umAnimal()} token="tok" aoMudar={vi.fn()} />);
    await usuario.click(screen.getByRole("button", { name: "Remover foto" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem permissão");

    chamadas.removerFoto.mockRejectedValueOnce(new Error("rede"));
    rerender(<EnvioDeFoto animal={umAnimal({ foto: { url: "/y" } })} token="tok" aoMudar={vi.fn()} />);
    await usuario.click(screen.getByRole("button", { name: "Remover foto" }));
    expect(await screen.findByText("A foto não foi removida.")).toBeInTheDocument();
  });
});

describe("pedido de adoção", () => {
  beforeEach(() => {
    chamadas.candidatar.mockReset();
  });

  it("envia o pedido com o que foi preenchido e mostra o protocolo", async () => {
    const usuario = userEvent.setup();
    const envio = adiada<ReturnType<typeof umPedido>>();
    chamadas.candidatar.mockReturnValue(envio.promessa);
    render(<PedidoDeAdocao animal={umAnimal()} />);

    await usuario.type(screen.getByLabelText("Seu nome"), "Maria");
    await usuario.type(screen.getByLabelText("E-mail"), "maria@exemplo.com");
    await usuario.type(screen.getByLabelText("Telefone"), "21988887777");
    await usuario.type(screen.getByLabelText("Cidade"), "Niterói");
    await usuario.selectOptions(screen.getByLabelText("Mora em"), "APARTAMENTO");
    await usuario.click(screen.getByRole("button", { name: "Tem tela, muro ou cerca" }));
    await usuario.click(screen.getByRole("button", { name: "Já tenho outros animais" }));
    await usuario.type(screen.getByLabelText("Sobre a sua rotina"), "  Trabalho em casa  ");
    await usuario.click(screen.getByRole("button", { name: "Enviar pedido" }));

    expect(screen.getByRole("button", { name: "Enviando" })).toBeDisabled();
    expect(chamadas.candidatar).toHaveBeenCalledWith(7, {
      nome: "Maria", email: "maria@exemplo.com", telefone: "21988887777", cidade: "Niterói", moradia: "APARTAMENTO",
      areaProtegida: false, temOutrosAnimais: true, mensagem: "Trabalho em casa"
    });

    envio.resolver(umPedido({ id: 88 }));
    expect(await screen.findByRole("status")).toHaveTextContent("protocolo é o número 88");
  });

  it("manda mensagem vazia como ausente e marca os campos reprovados", async () => {
    const usuario = userEvent.setup();
    chamadas.candidatar.mockImplementation(async () => {
      throw new ErroDaApi("Dados inválidos", 400, { nome: "informe seu nome" });
    });
    render(<PedidoDeAdocao animal={umAnimal()} />);

    await usuario.click(screen.getByRole("button", { name: "Enviar pedido" }));
    expect(chamadas.candidatar.mock.calls[0][1]).toMatchObject({ mensagem: undefined });
    expect(await screen.findByText("informe seu nome")).toBeInTheDocument();
    expect(screen.getByText("Confira os campos marcados.")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando não é erro de campo, e a genérica para falha de rede", async () => {
    const usuario = userEvent.setup();
    chamadas.candidatar.mockRejectedValueOnce(new ErroDaApi("Este animal não recebe pedidos agora.", 422));
    render(<PedidoDeAdocao animal={umAnimal()} />);

    await usuario.click(screen.getByRole("button", { name: "Enviar pedido" }));
    expect(await screen.findByText("Este animal não recebe pedidos agora.")).toBeInTheDocument();

    chamadas.candidatar.mockRejectedValueOnce(new Error("rede"));
    await usuario.click(screen.getByRole("button", { name: "Enviar pedido" }));
    expect(await screen.findByText("O pedido não foi enviado. Tente de novo.")).toBeInTheDocument();
  });

  it("não oferece formulário para quem não está disponível", () => {
    render(<PedidoDeAdocao animal={umAnimal({ status: "ADOTADO", statusRotulo: "Adotado" })} />);
    expect(screen.getByText("Estrela não está recebendo pedidos")).toBeInTheDocument();
    expect(screen.getByText(/“adotado”/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar pedido" })).toBeNull();
  });
});
