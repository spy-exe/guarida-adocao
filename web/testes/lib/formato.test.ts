import { describe, expect, it, vi } from "vitest";
import {
  corDaSituacao, data, dataPorExtenso, matizDoAnimal, mesCurto, peso, preencherMeses, rotuloCurto, tempoNoAbrigo,
  textoDoCredito
} from "@/lib/formato";

describe("datas", () => {
  it("escreve a data no formato brasileiro, ignorando a hora", () => {
    expect(data("2026-03-07")).toBe("07/03/2026");
    expect(data("2026-03-07T22:10:00")).toBe("07/03/2026");
  });

  it("abrevia o mês com o ano em dois dígitos", () => {
    expect(mesCurto("2026-01-01")).toBe("jan/26");
    expect(mesCurto("2025-12-01")).toBe("dez/25");
  });

  it("omite o ano quando a data é do ano corrente", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00"));
    expect(dataPorExtenso("2026-08-02")).toBe("2 de ago.");
    expect(dataPorExtenso("2024-11-20")).toBe("20 de nov. de 2024");
  });
});

describe("peso", () => {
  it("usa gramas abaixo de um quilo", () => {
    expect(peso(45)).toBe("45 g");
    expect(peso(999)).toBe("999 g");
  });

  it("usa uma casa decimal com vírgula até dez quilos e nenhuma depois", () => {
    expect(peso(1000)).toBe("1,0 kg");
    expect(peso(8900)).toBe("8,9 kg");
    expect(peso(32000)).toBe("32 kg");
  });
});

describe("tempo no abrigo", () => {
  const hoje = new Date("2026-09-15T12:00:00");

  it.each([
    ["2026-09-15", "chegou hoje"],
    ["2026-09-20", "chegou hoje"],
    ["2026-09-14", "há 1 dia"],
    ["2026-09-01", "há 14 dias"],
    ["2026-08-15", "há 1 mês"],
    ["2026-03-01", "há 6 meses"],
    ["2025-09-01", "há 1 ano"],
    ["2023-01-10", "há 3 anos"]
  ])("entrada em %s vira \"%s\"", (entrada, esperado) => {
    expect(tempoNoAbrigo(entrada, hoje)).toBe(esperado);
  });

  it("usa a data de hoje quando nenhuma é passada", () => {
    expect(tempoNoAbrigo(new Date().toISOString())).toBe("chegou hoje");
  });
});

describe("situação", () => {
  it("dá uma cor para cada situação e uma neutra para o desconhecido", () => {
    expect(corDaSituacao("DISPONIVEL")).toBe("var(--disponivel)");
    expect(corDaSituacao("ADOTADO")).toBe("var(--adotado)");
    expect(corDaSituacao("OUTRA" as never)).toBe("var(--tinta-3)");
  });

  it("encurta o rótulo para caber no canto do cartão", () => {
    expect(rotuloCurto("Disponível para adoção")).toBe("Disponível");
    expect(rotuloCurto("Em processo de adoção")).toBe("Em processo");
    expect(rotuloCurto("Indisponível no momento")).toBe("Indisponível");
    expect(rotuloCurto("Adotado")).toBe("Adotado");
  });
});

describe("meses do gráfico", () => {
  it("completa com zero os meses sem adoção, do mais antigo ao atual", () => {
    const meses = preencherMeses([{ mes: "2026-08-01", quantidade: 2 }, { mes: "2026-06-01", quantidade: 1 }], 4,
      new Date("2026-09-10T12:00:00"));

    expect(meses).toEqual([
      { mes: "2026-06-01", quantidade: 1 },
      { mes: "2026-07-01", quantidade: 0 },
      { mes: "2026-08-01", quantidade: 2 },
      { mes: "2026-09-01", quantidade: 0 }
    ]);
  });

  it("atravessa a virada do ano", () => {
    const meses = preencherMeses([], 3, new Date("2026-01-20T12:00:00"));
    expect(meses.map((m) => m.mes)).toEqual(["2025-11-01", "2025-12-01", "2026-01-01"]);
  });

  it("usa hoje quando nenhuma data é passada", () => {
    expect(preencherMeses([], 12)).toHaveLength(12);
  });
});

describe("foto", () => {
  it("deriva um matiz estável do id", () => {
    expect(matizDoAnimal(1)).toBe("hsl(47 24% 90%)");
    expect(matizDoAnimal(8)).toBe(matizDoAnimal(8));
    expect(matizDoAnimal(8)).not.toBe(matizDoAnimal(9));
  });

  it("monta o crédito só com o que foi informado", () => {
    expect(textoDoCredito("Ana", "CC BY 4.0")).toBe("Ana, CC BY 4.0");
    expect(textoDoCredito(undefined, "CC0")).toBe("CC0");
    expect(textoDoCredito("Ana")).toBe("Ana");
    expect(textoDoCredito()).toBeNull();
  });
});
