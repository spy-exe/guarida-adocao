import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GraficoDeAdocoes from "@/components/GraficoDeAdocoes";
import GraficoDeEspecies from "@/components/GraficoDeEspecies";
import ProporcaoPorSituacao from "@/components/ProporcaoPorSituacao";
import { CORES_DE_ESPECIE, corDaEspecie } from "@/lib/paleta";
import { umResumo } from "../fixtures";

const meses = [
  { mes: "2026-07-01", quantidade: 0 },
  { mes: "2026-08-01", quantidade: 1 },
  { mes: "2026-09-01", quantidade: 3 }
];

describe("gráfico de adoções", () => {
  it("resume o período e lê o mês sob o ponteiro", () => {
    render(<GraficoDeAdocoes meses={meses} />);
    expect(screen.getByText("4 nos últimos 3 meses")).toBeInTheDocument();

    const barras = screen.getAllByTestId("barra-mes");
    fireEvent.mouseEnter(barras[1]);
    expect(screen.getByText("ago/26: 1 adoção")).toBeInTheDocument();
    fireEvent.mouseEnter(barras[2]);
    expect(screen.getByText("set/26: 3 adoções")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("img"));
    expect(screen.getByText("4 nos últimos 3 meses")).toBeInTheDocument();
  });

  it("guarda uma tabela para leitor de tela com todos os meses", () => {
    render(<GraficoDeAdocoes meses={meses} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("rowheader", { name: "jul/26" })).toBeInTheDocument();
  });

  it("sem adoção diz isso em vez de desenhar barras vazias", () => {
    render(<GraficoDeAdocoes meses={[{ mes: "2026-09-01", quantidade: 0 }]} />);
    expect(screen.getByText("Nenhuma adoção concluída nos últimos meses.")).toBeInTheDocument();
    expect(screen.queryByTestId("barra-mes")).toBeNull();
  });
});

describe("gráfico de espécies", () => {
  it("desenha barra proporcional ao maior valor, com piso visível", () => {
    const { container } = render(<GraficoDeEspecies fatias={[
      { especie: "CACHORRO", rotulo: "Cachorro", quantidade: 20 },
      { especie: "PASSARO", rotulo: "Pássaro", quantidade: 0 }
    ]} />);
    const barras = container.querySelectorAll<HTMLElement>(".barra-preenchida");
    expect(barras[0].style.width).toBe("100%");
    expect(barras[1].style.width).toBe("3%");
    expect(screen.getByText("Pássaro")).toBeInTheDocument();
  });

  it("avisa quando não há animal", () => {
    render(<GraficoDeEspecies fatias={[]} />);
    expect(screen.getByText("Nenhum animal cadastrado ainda.")).toBeInTheDocument();
  });
});

describe("proporção por situação", () => {
  it("divide a barra só entre as situações presentes e descreve em texto", () => {
    const { container } = render(<ProporcaoPorSituacao resumo={umResumo()} />);
    expect(container.querySelectorAll(".proporcao span")).toHaveLength(3);
    expect(screen.getByRole("img")).toHaveAccessibleName("21 esperando casa, 3 em processo, 4 adotados");
    expect(screen.getByText(/leva 124 dias/)).toBeInTheDocument();
  });

  it("no singular e sem barra quando o acervo está vazio", () => {
    const { rerender } = render(<ProporcaoPorSituacao resumo={umResumo({ total: 1, disponiveis: 1, emProcesso: 0,
      adotados: 0, mediaDeDiasAteAdocao: 0 })} />);
    expect(screen.getByText("animal no acervo")).toBeInTheDocument();
    expect(screen.queryByText(/leva/)).toBeNull();

    rerender(<ProporcaoPorSituacao resumo={umResumo({ total: 0, disponiveis: 0, emProcesso: 0, adotados: 0 })} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("paleta", () => {
  it("a cor segue a espécie e o desconhecido usa a última da paleta", () => {
    expect(corDaEspecie("GATO")).toBe(CORES_DE_ESPECIE.GATO);
    expect(corDaEspecie("DRAGAO" as never)).toBe("#6b5aa8");
  });
});
