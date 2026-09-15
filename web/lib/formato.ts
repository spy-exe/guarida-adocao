import type { StatusAnimal } from "./api";

export function data(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function mesCurto(iso: string): string {
  const [ano, mes] = iso.slice(0, 10).split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

/** "12 de ago." em vez de "12/08/2026", que e como gente escreve data em lista. */
export function dataPorExtenso(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  const esteAno = String(new Date().getFullYear()) === ano;
  return `${Number(dia)} de ${MESES[Number(mes) - 1]}.${esteAno ? "" : ` de ${ano}`}`;
}

export function peso(gramas: number): string {
  if (gramas < 1000) {
    return `${gramas} g`;
  }
  const quilos = gramas / 1000;
  return `${quilos.toFixed(quilos < 10 ? 1 : 0).replace(".", ",")} kg`;
}

/** Tempo que o animal esta no abrigo, dito do jeito que alguem falaria. */
export function tempoNoAbrigo(isoEntrada: string, hoje: Date = new Date()): string {
  const entrada = new Date(`${isoEntrada.slice(0, 10)}T12:00:00`);
  const dias = Math.max(0, Math.floor((hoje.getTime() - entrada.getTime()) / 86_400_000));
  if (dias < 1) return "chegou hoje";
  if (dias < 30) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
}

const CORES: Record<StatusAnimal, string> = {
  DISPONIVEL: "var(--disponivel)",
  EM_PROCESSO: "var(--em-processo)",
  ADOTADO: "var(--adotado)",
  INDISPONIVEL: "var(--indisponivel)"
};

export function corDaSituacao(status: StatusAnimal): string {
  return CORES[status] ?? "var(--tinta-3)";
}

/**
 * "Disponível para adoção" não cabe no canto de um cartão. Ali basta a palavra
 * que muda de um estado para outro.
 */
export function rotuloCurto(rotulo: string): string {
  return rotulo
    .replace(" para adoção", "")
    .replace(" de adoção", "")
    .replace(" no momento", "");
}

/** Completa os meses sem adoção, para o eixo do gráfico não mentir sobre o tempo. */
export function preencherMeses(
  registros: Array<{ mes: string; quantidade: number }>,
  quantosMeses: number,
  hoje: Date = new Date()
): Array<{ mes: string; quantidade: number }> {
  const porMes = new Map(registros.map((registro) => [registro.mes.slice(0, 7), registro.quantidade]));
  const preenchidos: Array<{ mes: string; quantidade: number }> = [];

  for (let atras = quantosMeses - 1; atras >= 0; atras -= 1) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth() - atras, 1);
    const chave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}`;
    preenchidos.push({ mes: `${chave}-01`, quantidade: porMes.get(chave) ?? 0 });
  }

  return preenchidos;
}

/** Quem não tem foto ganha um fundo de cor própria, derivado do id. */
export function matizDoAnimal(id: number): string {
  return `hsl(${(id * 47) % 360} 24% 90%)`;
}

/** Licença curta e link de volta, que é o que a atribuição de foto livre pede. */
export function textoDoCredito(autor?: string, licenca?: string): string | null {
  if (!autor && !licenca) return null;
  return [autor, licenca].filter(Boolean).join(", ");
}
