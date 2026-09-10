import type { Especie, StatusAnimal } from "./api";

export function data(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function dataCurta(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

export function mesPorExtenso(iso: string): string {
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez"];
  const [ano, mes] = iso.slice(0, 10).split("-");
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
}

export function peso(gramas: number): string {
  if (gramas < 1000) {
    return `${gramas} g`;
  }
  return `${(gramas / 1000).toFixed(1).replace(".", ",")} kg`;
}

const CORES_DE_SITUACAO: Record<StatusAnimal, string> = {
  DISPONIVEL: "var(--disponivel)",
  EM_PROCESSO: "var(--em-processo)",
  ADOTADO: "var(--adotado)",
  INDISPONIVEL: "var(--indisponivel)"
};

export function corDaSituacao(status: StatusAnimal): string {
  return CORES_DE_SITUACAO[status] ?? "var(--tinta-fraca)";
}

/**
 * O abrigo nao tem foto de todo animal, e foto de banco de imagem mentiria
 * sobre quem esta ali. Cada ficha ganha entao um matiz proprio, derivado do
 * id, para que dois animais nunca saiam iguais na tela.
 */
export function matizDoAnimal(id: number): string {
  const angulo = (id * 47) % 360;
  return `hsl(${angulo} 26% 92%)`;
}

const ARTIGOS: Record<Especie, string> = {
  CACHORRO: "o",
  GATO: "o",
  COELHO: "o",
  PASSARO: "o",
  OUTRO: "o"
};

export function artigo(especie: Especie, sexo: "MACHO" | "FEMEA"): string {
  return sexo === "FEMEA" ? "a" : ARTIGOS[especie] ?? "o";
}

/**
 * "Disponivel para adocao" nao cabe no canto de um cartao nem numa coluna de
 * lista. Nesses lugares basta a palavra que muda de um estado para outro.
 */
export function rotuloCurto(rotulo: string): string {
  return rotulo
    .replace(" para adocao", "")
    .replace(" de adocao", "")
    .replace(" no momento", "");
}

/** Completa os meses sem adocao, para o eixo do grafico nao mentir sobre o tempo. */
export function preencherMeses(
  registros: Array<{ mes: string; quantidade: number }>,
  quantosMeses: number
): Array<{ mes: string; quantidade: number }> {
  const porMes = new Map(registros.map((registro) => [registro.mes.slice(0, 7), registro.quantidade]));
  const hoje = new Date();
  const preenchidos: Array<{ mes: string; quantidade: number }> = [];

  for (let atras = quantosMeses - 1; atras >= 0; atras -= 1) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    preenchidos.push({ mes: `${chave}-01`, quantidade: porMes.get(chave) ?? 0 });
  }

  return preenchidos;
}
