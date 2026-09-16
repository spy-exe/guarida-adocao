import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Campo from "@/components/Campo";
import CartaoDeAnimal from "@/components/CartaoDeAnimal";
import Credito from "@/components/Credito";
import FotoDoAnimal from "@/components/FotoDoAnimal";
import IconeDaEspecie from "@/components/IconeDaEspecie";
import Marca from "@/components/Marca";
import Retrato from "@/components/Retrato";
import Rodape from "@/components/Rodape";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import Topo from "@/components/Topo";
import type { Especie } from "@/lib/api";
import { umAnimal } from "../fixtures";

describe("marca, topo e rodapé", () => {
  it("mostra o nome e o complemento só quando existe", () => {
    const { container, rerender } = render(<Marca complemento="área do abrigo" />);
    expect(screen.getByText("Guarida")).toBeInTheDocument();
    expect(screen.getByText("área do abrigo")).toBeInTheDocument();

    rerender(<Marca />);
    expect(container.querySelector(".marca-complemento")).toBeNull();
  });

  it("o topo leva para a página inicial e mostra a navegação recebida", () => {
    render(<Topo complemento="x"><a href="/painel">Acervo</a></Topo>);
    expect(screen.getByRole("link", { name: "Guarida, página inicial" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Acervo" })).toBeInTheDocument();
  });

  it("o rodapé assina o trabalho com o grupo inteiro e credita o Commons", () => {
    render(<Rodape />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText(/Mellani Lyvian de Macêdo dos Santos/)).toBeInTheDocument();
    expect(screen.getByText("202310773")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute("rel", "noreferrer");
  });
});

describe("campo de formulário", () => {
  it("amarra rótulo e controle pelo id", () => {
    render(<Campo id="nome" rotulo="Nome"><input id="nome" /></Campo>);
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("mostra o erro no lugar da ajuda e marca o campo", () => {
    const { container, rerender } = render(<Campo id="p" rotulo="Peso" ajuda="Em gramas"><input id="p" /></Campo>);
    expect(screen.getByText("Em gramas")).toBeInTheDocument();

    rerender(<Campo id="p" rotulo="Peso" ajuda="Em gramas" erro="Peso inválido"><input id="p" /></Campo>);
    expect(screen.getByRole("alert")).toHaveTextContent("Peso inválido");
    expect(screen.queryByText("Em gramas")).toBeNull();
    expect(container.firstChild).toHaveAttribute("data-erro", "sim");
  });

  it("sem erro nem ajuda não sobra nada embaixo", () => {
    const { container } = render(<Campo id="c" rotulo="Cidade"><input id="c" /></Campo>);
    expect(container.querySelector(".campo-ajuda, .campo-erro")).toBeNull();
  });
});

describe("selo e ícone", () => {
  it("encurta o rótulo só quando pedido", () => {
    const { rerender } = render(<SeloDeSituacao status="DISPONIVEL" rotulo="Disponível para adoção" />);
    expect(screen.getByText("Disponível para adoção")).toHaveAttribute("data-estado", "DISPONIVEL");
    rerender(<SeloDeSituacao status="DISPONIVEL" rotulo="Disponível para adoção" curto />);
    expect(screen.getByText("Disponível")).toBeInTheDocument();
  });

  it.each(["CACHORRO", "GATO", "COELHO", "PASSARO", "OUTRO", "DESCONHECIDA"])("desenha um ícone para %s", (especie) => {
    const { container } = render(<IconeDaEspecie especie={especie as Especie} size={12} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["CACHORRO", "GATO", "COELHO", "PASSARO", "OUTRO", "DESCONHECIDA"])("tem retrato de %s", (especie) => {
    const { container } = render(<Retrato especie={especie as Especie} cor="red" />);
    expect(container.querySelector("svg g")).not.toBeNull();
  });

  it("o retrato usa a cor da marca quando nenhuma é dada", () => {
    const { container } = render(<Retrato especie="GATO" />);
    expect(container.querySelector("svg")).toHaveStyle({ color: "var(--musgo)" });
  });
});

describe("foto do animal", () => {
  it("usa a foto com texto alternativo que diz quem é", () => {
    render(<FotoDoAnimal animal={umAnimal()} prioridade tamanhos="100vw" />);
    const imagem = screen.getByRole("img", { name: "Estrela, cachorro" });
    expect(imagem).toHaveAttribute("loading", "eager");
    expect(imagem).toHaveAttribute("sizes", "100vw");
  });

  it("carrega sob demanda fora da primeira dobra", () => {
    render(<FotoDoAnimal animal={umAnimal()} />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("sem foto mostra o retrato com fundo próprio", () => {
    render(<FotoDoAnimal animal={umAnimal({ foto: undefined })} />);
    expect(screen.getByRole("img", { name: "Estrela, cachorro, ainda sem foto" })).toHaveClass("retrato");
  });

  it("se a imagem falhar troca pelo retrato", () => {
    render(<FotoDoAnimal animal={umAnimal()} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img", { name: /ainda sem foto/ })).toBeInTheDocument();
  });
});

describe("crédito da foto", () => {
  it("mostra autor, licença e link de volta", () => {
    render(<Credito foto={umAnimal().foto} />);
    expect(screen.getByText("Foto de Sturm")).toBeInTheDocument();
    expect(screen.getByText("· CC BY-SA 4.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ver original" })).toHaveAttribute("target", "_blank");
  });

  it("não mostra link que não seja http, mesmo que tenha sido gravado", () => {
    render(<Credito foto={{ url: "/x", autor: "Ana", fonte: "javascript:alert(1)" }} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it("admite licença sem autor", () => {
    render(<Credito foto={{ url: "/x", licenca: "CC0" }} />);
    expect(screen.getByText("Foto de autor não informado")).toBeInTheDocument();
  });

  it("some quando não há foto ou crédito", () => {
    const { container, rerender } = render(<Credito />);
    expect(container).toBeEmptyDOMElement();
    rerender(<Credito foto={{ url: "/x" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("cartão de animal", () => {
  it("leva para a ficha e não repete o selo de quem está disponível", () => {
    render(<CartaoDeAnimal animal={umAnimal()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/animal/7");
    expect(screen.getByText("Porte médio")).toBeInTheDocument();
    expect(screen.queryByText("Disponível")).toBeNull();
  });

  it("marca quem já não está disponível", () => {
    render(<CartaoDeAnimal animal={umAnimal({ sexo: "MACHO", sexoRotulo: "Macho", status: "EM_PROCESSO",
                                              statusRotulo: "Em processo de adoção" })} prioridade />);
    expect(screen.getByText("Em processo")).toBeInTheDocument();
    expect(screen.getByText("Macho")).toBeInTheDocument();
  });
});
