/*
  Fisica da plaquinha de coleira, separada do WebGL para poder ser testada.

    aceleracao angular = -(g / comprimento) * sen(angulo) - atrito * velocidade

  O seno importa. Trocar por uma mola linear daria vaivem de metronomo, e um
  pendulo de verdade desacelera perto do ponto mais alto. O passo de tempo e
  limitado porque aba em segundo plano devolve intervalos enormes, e um passo
  gigante faria a peca dar volta completa ao voltar para a aba.
*/

export interface EstadoDoPendulo {
  angulo: number;
  velocidade: number;
  giro: number;
  velocidadeDoGiro: number;
}

export const GRAVIDADE_EFETIVA = 1.2;
export const ATRITO = 0.9;
export const ATRITO_DO_GIRO = 0.975;
export const ANGULO_MAXIMO = 1.15;
export const PASSO_MAXIMO = 0.05;

export function avancar(estado: EstadoDoPendulo, passo: number): EstadoDoPendulo {
  const dt = Math.min(Math.max(passo, 0), PASSO_MAXIMO);
  const aceleracao = -GRAVIDADE_EFETIVA * Math.sin(estado.angulo) - ATRITO * estado.velocidade;
  const velocidade = estado.velocidade + aceleracao * dt;

  let velocidadeDoGiro = estado.velocidadeDoGiro * ATRITO_DO_GIRO;
  if (Math.abs(velocidadeDoGiro) < 0.00004) velocidadeDoGiro = 0;

  return {
    angulo: estado.angulo + velocidade * dt,
    velocidade,
    giro: estado.giro + velocidadeDoGiro,
    velocidadeDoGiro
  };
}

/** Arrasto lateral empurra o pendulo; arrasto vertical gira a peca no proprio eixo. */
export function arrastar(estado: EstadoDoPendulo, dx: number, dy: number): EstadoDoPendulo {
  const velocidade = -dx * 0.012;
  const velocidadeDoGiro = dy * 0.01;
  return {
    angulo: limitar(estado.angulo + velocidade, ANGULO_MAXIMO),
    velocidade,
    giro: estado.giro + velocidadeDoGiro,
    velocidadeDoGiro
  };
}

export function emRepouso(estado: EstadoDoPendulo): boolean {
  return Math.abs(estado.velocidade) < 0.0008 && Math.abs(estado.angulo) < 0.004
    && estado.velocidadeDoGiro === 0;
}

export function limitar(valor: number, maximo: number): number {
  return Math.max(-maximo, Math.min(maximo, valor));
}
