import Link from "next/link";
import Retrato from "@/components/Retrato";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import type { Animal } from "@/lib/api";
import { matizDoAnimal, peso, rotuloCurto } from "@/lib/formato";

export default function CartaoDeAnimal({ animal, indice = 0 }: { animal: Animal; indice?: number }) {
  return (
    <Link
      className="cartao entra"
      style={{ animationDelay: `${Math.min(indice, 10) * 40}ms` }}
      href={`/animal/${animal.id}`}
    >
      <div className="cartao-retrato" style={{ background: matizDoAnimal(animal.id) }}>
        <Retrato especie={animal.especie} />
      </div>

      <div className="cartao-dados">
        <div className="cartao-nome">
          <h3>{animal.nome}</h3>
          <SeloDeSituacao status={animal.status} rotulo={rotuloCurto(animal.statusRotulo)} />
        </div>

        <span className="cartao-linha">
          {animal.especieRotulo} · {animal.sexoRotulo} · {animal.porteRotulo}
        </span>
        <span className="cartao-linha">
          {animal.idadeRotulo} · {peso(animal.pesoEmGramas)}
          {animal.raca ? ` · ${animal.raca}` : ""}
        </span>

        {animal.temperamentos.length > 0 && (
          <div className="cartao-tracos">
            {animal.temperamentos.slice(0, 3).map((traco) => (
              <span className="traco" key={traco.chave}>
                {traco.rotulo}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
