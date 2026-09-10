"use client";

import type { FatiaDeEspecie } from "@/lib/api";
import { corDaEspecie } from "@/lib/paleta";

/*
  Quantos animais de cada especie o abrigo mantem. Barra deitada e nao pizza:
  comparar comprimento e facil, comparar angulo nao e. Cada barra carrega o
  proprio rotulo, entao a identidade nunca depende so da cor.
*/
export default function GraficoDeEspecies({ fatias }: { fatias: FatiaDeEspecie[] }) {
  if (fatias.length === 0) {
    return (
      <figure className="grafico">
        <figcaption className="grafico-titulo">
          <span className="etiqueta">Por especie</span>
        </figcaption>
        <p className="grafico-vazio">Nenhum animal cadastrado ainda.</p>
      </figure>
    );
  }

  const teto = Math.max(...fatias.map((fatia) => fatia.quantidade), 1);

  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">
        <span className="etiqueta">Por especie</span>
      </figcaption>

      <ul className="barras">
        {fatias.map((fatia) => (
          <li key={fatia.especie} className="barra">
            <span className="barra-rotulo">{fatia.rotulo}</span>
            <span className="barra-trilho">
              <span
                className="barra-preenchida"
                style={{
                  width: `${Math.max((fatia.quantidade / teto) * 100, 2)}%`,
                  background: corDaEspecie(fatia.especie)
                }}
              />
            </span>
            <span className="barra-valor">{fatia.quantidade}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
