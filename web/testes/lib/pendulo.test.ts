import { describe, expect, it } from "vitest";
import {
  ANGULO_MAXIMO, PASSO_MAXIMO, arrastar, avancar, emRepouso, limitar, type EstadoDoPendulo
} from "@/lib/pendulo";

const parado: EstadoDoPendulo = { angulo: 0, velocidade: 0, giro: 0, velocidadeDoGiro: 0 };

describe("pêndulo da plaquinha", () => {
  it("parado no ponto mais baixo continua parado", () => {
    expect(avancar(parado, 0.016)).toEqual(parado);
    expect(emRepouso(parado)).toBe(true);
  });

  it("solto de lado acelera de volta para o centro", () => {
    const depois = avancar({ ...parado, angulo: 0.5 }, 0.016);
    expect(depois.velocidade).toBeLessThan(0);
    expect(depois.angulo).toBeLessThan(0.5);
  });

  it("perde energia com o atrito e acaba em repouso", () => {
    let estado: EstadoDoPendulo = { ...parado, angulo: 0.9, velocidadeDoGiro: 0.2 };
    for (let quadro = 0; quadro < 6000; quadro += 1) {
      estado = avancar(estado, 1 / 60);
    }
    expect(emRepouso(estado)).toBe(true);
  });

  it("limita o passo de tempo para uma aba que volta do segundo plano", () => {
    const solto = { ...parado, angulo: 0.5 };
    expect(avancar(solto, 12)).toEqual(avancar(solto, PASSO_MAXIMO));
    expect(avancar(solto, -1)).toEqual(avancar(solto, 0));
  });

  it("zera o giro residual pequeno demais para aparecer", () => {
    expect(avancar({ ...parado, velocidadeDoGiro: 0.00003 }, 0.016).velocidadeDoGiro).toBe(0);
    expect(avancar({ ...parado, velocidadeDoGiro: 0.1 }, 0.016).velocidadeDoGiro).toBeCloseTo(0.0975);
  });

  it("arrasto lateral empurra no sentido contrário e vertical gira", () => {
    const arrastado = arrastar(parado, 10, 5);
    expect(arrastado.velocidade).toBeCloseTo(-0.12);
    expect(arrastado.angulo).toBeCloseTo(-0.12);
    expect(arrastado.giro).toBeCloseTo(0.05);
  });

  it("arrasto forte não passa do ângulo máximo", () => {
    expect(arrastar(parado, -1000, 0).angulo).toBe(ANGULO_MAXIMO);
    expect(arrastar(parado, 1000, 0).angulo).toBe(-ANGULO_MAXIMO);
  });

  it("não considera repouso enquanto ainda gira ou balança", () => {
    expect(emRepouso({ ...parado, velocidadeDoGiro: 0.001 })).toBe(false);
    expect(emRepouso({ ...parado, angulo: 0.1 })).toBe(false);
    expect(emRepouso({ ...parado, velocidade: 0.01 })).toBe(false);
  });

  it("limita nos dois sentidos", () => {
    expect(limitar(3, 2)).toBe(2);
    expect(limitar(-3, 2)).toBe(-2);
    expect(limitar(1, 2)).toBe(1);
  });
});
