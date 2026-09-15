"use client";

import { useId, useState } from "react";
import { HeartHandshake } from "lucide-react";
import type { AdocoesNoMes } from "@/lib/api";
import { mesCurto } from "@/lib/formato";
import { COR_DA_SERIE_UNICA } from "@/lib/paleta";

/*
  Adoções concluídas por mês. Série única, sem legenda: o título diz o que a
  barra mede. O número aparece no cabeçalho conforme o ponteiro passa, em vez
  de rotular toda barra.
*/

const ALTURA = 150;
const MARGEM_INFERIOR = 16;
const MARGEM_SUPERIOR = 10;

export default function GraficoDeAdocoes({ meses }: { meses: AdocoesNoMes[] }) {
  const identificador = useId();
  const [emFoco, setEmFoco] = useState<number | null>(null);
  const total = meses.reduce((soma, mes) => soma + mes.quantidade, 0);

  if (total === 0) {
    return (
      <figure className="grafico painel-caixa">
        <figcaption className="grafico-cabecalho"><h3>Adoções por mês</h3></figcaption>
        <div className="grafico-vazio">
          <HeartHandshake size={22} aria-hidden="true" />
          Nenhuma adoção concluída nos últimos meses.
        </div>
      </figure>
    );
  }

  const teto = Math.max(...meses.map((mes) => mes.quantidade), 1);
  const faixa = 100 / meses.length;
  const util = ALTURA - MARGEM_INFERIOR - MARGEM_SUPERIOR;
  const foco = emFoco === null ? null : meses[emFoco];

  return (
    <figure className="grafico painel-caixa">
      <figcaption className="grafico-cabecalho">
        <h3>Adoções por mês</h3>
        <span className="grafico-leitura" aria-live="polite">
          {foco
            ? `${mesCurto(foco.mes)}: ${foco.quantidade} ${foco.quantidade === 1 ? "adoção" : "adoções"}`
            : `${total} nos últimos ${meses.length} meses`}
        </span>
      </figcaption>

      <svg viewBox={`0 0 100 ${ALTURA}`} preserveAspectRatio="none" role="img"
           aria-labelledby={`${identificador}-t`} className="grafico-tela" onMouseLeave={() => setEmFoco(null)}>
        <title id={`${identificador}-t`}>Adoções concluídas por mês</title>
        {[0.5, 1].map((fracao) => (
          <line key={fracao} x1="0" x2="100" y1={MARGEM_SUPERIOR + util * (1 - fracao)}
                y2={MARGEM_SUPERIOR + util * (1 - fracao)} className="grafico-apoio" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1="0" x2="100" y1={ALTURA - MARGEM_INFERIOR} y2={ALTURA - MARGEM_INFERIOR}
              className="grafico-base" vectorEffect="non-scaling-stroke" />
        {meses.map((mes, indice) => {
          const altura = mes.quantidade === 0 ? 0 : Math.max((mes.quantidade / teto) * util, 2);
          return (
            <g key={mes.mes} onMouseEnter={() => setEmFoco(indice)} data-testid="barra-mes">
              <rect x={indice * faixa} y={0} width={faixa} height={ALTURA} fill="transparent" />
              <rect x={indice * faixa + faixa * 0.22} y={ALTURA - MARGEM_INFERIOR - altura}
                    width={faixa * 0.56} height={altura} rx="0.8" fill={COR_DA_SERIE_UNICA}
                    opacity={emFoco === null || emFoco === indice ? 1 : 0.3} />
            </g>
          );
        })}
      </svg>

      <div className="grafico-eixo">
        <span>{mesCurto(meses[0].mes)}</span>
        <span>{mesCurto(meses[meses.length - 1].mes)}</span>
      </div>

      <table className="apenas-leitor">
        <caption>Adoções concluídas por mês</caption>
        <tbody>
          {meses.map((mes) => (
            <tr key={mes.mes}><th scope="row">{mesCurto(mes.mes)}</th><td>{mes.quantidade}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
