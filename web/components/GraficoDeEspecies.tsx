import IconeDaEspecie from "@/components/IconeDaEspecie";
import type { FatiaDeEspecie } from "@/lib/api";
import { corDaEspecie } from "@/lib/paleta";

/*
  Quantos animais de cada espécie. Barra deitada e não pizza: comparar
  comprimento é fácil, comparar ângulo não é. Cada barra tem rótulo e ícone,
  então a identidade nunca depende só da cor.
*/
export default function GraficoDeEspecies({ fatias }: { fatias: FatiaDeEspecie[] }) {
  const teto = Math.max(...fatias.map((fatia) => fatia.quantidade), 1);

  return (
    <figure className="grafico painel-caixa">
      <figcaption className="grafico-cabecalho"><h3>Por espécie</h3></figcaption>
      {fatias.length === 0 ? (
        <div className="grafico-vazio">Nenhum animal cadastrado ainda.</div>
      ) : (
        <ul className="barras">
          {fatias.map((fatia) => (
            <li key={fatia.especie} className="barra">
              <span className="barra-rotulo">
                <IconeDaEspecie especie={fatia.especie} size={15} />
                {fatia.rotulo}
              </span>
              <span className="barra-trilho">
                <span className="barra-preenchida"
                      style={{ width: `${Math.max((fatia.quantidade / teto) * 100, 3)}%`, background: corDaEspecie(fatia.especie) }} />
              </span>
              <span className="barra-valor">{fatia.quantidade}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
