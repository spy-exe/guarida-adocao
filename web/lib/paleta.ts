import type { Especie } from "./api";

/**
 * Paleta dos graficos.
 *
 * A ordem e fixa e a cor segue a especie, nunca a posicao no ranking: se um
 * filtro tirar os coelhos da lista, os gatos continuam do mesmo verde. Os cinco
 * tons passaram na conferencia de banda de luminosidade, piso de croma,
 * separacao sob daltonismo protan, deutan e tritan, e contraste contra o papel.
 */
export const CORES_DE_ESPECIE: Record<Especie, string> = {
  CACHORRO: "#c25c33",
  GATO: "#149470",
  COELHO: "#3a6ea8",
  PASSARO: "#b0455c",
  OUTRO: "#6b5aa8"
};

/** Serie unica usa a tinta da marca: sem competicao de identidade, sem legenda. */
export const COR_DA_SERIE_UNICA = "#38503a";

export function corDaEspecie(especie: Especie): string {
  return CORES_DE_ESPECIE[especie] ?? "#6b5aa8";
}
