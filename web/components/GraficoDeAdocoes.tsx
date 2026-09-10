"use client";

import { useId, useState } from "react";
import type { AdocoesNoMes } from "@/lib/api";
import { mesPorExtenso } from "@/lib/formato";
import { COR_DA_SERIE_UNICA } from "@/lib/paleta";

/*
  Adocoes concluidas por mes. Serie unica, entao sem legenda: o titulo ja diz o
  que a barra mede. O numero aparece no cabecalho conforme o ponteiro passa, em
  vez de rotular toda barra, que viraria ruido.
*/

const ALTURA = 150;
const MARGEM_INFERIOR = 18;
const MARGEM_SUPERIOR = 12;

export default function GraficoDeAdocoes({ meses }: { meses: AdocoesNoMes[] }) {
  const identificador = useId();
  const [emFoco, setEmFoco] = useState<number | null>(null);

  if (meses.length === 0) {
    return (
      <figure className="grafico">
        <figcaption className="grafico-titulo">
          <span className="etiqueta">Adocoes por mes</span>
        </figcaption>
        <p className="grafico-vazio">Nenhuma adocao concluida ainda.</p>
      </figure>
    );
  }

  const teto = Math.max(...meses.map((mes) => mes.quantidade), 1);
  const larguraDaFaixa = 100 / meses.length;
  const areaUtil = ALTURA - MARGEM_INFERIOR - MARGEM_SUPERIOR;
  const foco = emFoco === null ? null : meses[emFoco];
  const total = meses.reduce((soma, mes) => soma + mes.quantidade, 0);

  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">
        <span className="etiqueta">Adocoes por mes</span>
        <span className="grafico-leitura">
          {foco
            ? `${mesPorExtenso(foco.mes)}: ${foco.quantidade}`
            : `${total} no periodo`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 100 ${ALTURA}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={`${identificador}-titulo`}
        className="grafico-tela"
        onMouseLeave={() => setEmFoco(null)}
      >
        <title id={`${identificador}-titulo`}>Adocoes concluidas por mes</title>

        {[0.5, 1].map((fracao) => (
          <line
            key={fracao}
            x1="0"
            x2="100"
            y1={MARGEM_SUPERIOR + areaUtil * (1 - fracao)}
            y2={MARGEM_SUPERIOR + areaUtil * (1 - fracao)}
            className="grafico-apoio"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <line x1="0" x2="100" y1={ALTURA - MARGEM_INFERIOR} y2={ALTURA - MARGEM_INFERIOR}
              className="grafico-base" vectorEffect="non-scaling-stroke" />

        {meses.map((mes, indice) => {
          const altura = (mes.quantidade / teto) * areaUtil;
          const x = indice * larguraDaFaixa;

          return (
            <g key={mes.mes} onMouseEnter={() => setEmFoco(indice)}>
              {/* alvo de mouse maior que a barra, para nao exigir pontaria */}
              <rect x={x} y={0} width={larguraDaFaixa} height={ALTURA} fill="transparent" />
              <rect
                x={x + larguraDaFaixa * 0.2}
                y={ALTURA - MARGEM_INFERIOR - Math.max(altura, mes.quantidade > 0 ? 2 : 0)}
                width={larguraDaFaixa * 0.6}
                height={Math.max(altura, mes.quantidade > 0 ? 2 : 0)}
                fill={COR_DA_SERIE_UNICA}
                opacity={emFoco === null || emFoco === indice ? 1 : 0.32}
                rx="0.7"
              />
            </g>
          );
        })}
      </svg>

      <div className="grafico-eixo">
        <span>{mesPorExtenso(meses[0].mes)}</span>
        {meses.length > 2 && <span>{mesPorExtenso(meses[Math.floor(meses.length / 2)].mes)}</span>}
        <span>{mesPorExtenso(meses[meses.length - 1].mes)}</span>
      </div>

      <table className="apenas-leitor-de-tela">
        <caption>Adocoes concluidas por mes</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Adocoes</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((mes) => (
            <tr key={mes.mes}>
              <th scope="row">{mesPorExtenso(mes.mes)}</th>
              <td>{mes.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
