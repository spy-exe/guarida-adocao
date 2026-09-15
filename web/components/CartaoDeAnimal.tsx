import Link from "next/link";
import { MapPin, Mars, Venus } from "lucide-react";
import FotoDoAnimal from "@/components/FotoDoAnimal";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import type { Animal } from "@/lib/api";

export default function CartaoDeAnimal({ animal, prioridade = false }: { animal: Animal; prioridade?: boolean }) {
  const Sexo = animal.sexo === "FEMEA" ? Venus : Mars;

  return (
    <Link className="cartao" href={`/animal/${animal.id}`}>
      <div className="cartao-foto">
        <FotoDoAnimal animal={animal} prioridade={prioridade} tamanhos="(max-width: 640px) 100vw, 280px" />
        {animal.status !== "DISPONIVEL" && <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} curto />}
      </div>

      <div className="cartao-corpo">
        <div className="cartao-nome">
          <h3>{animal.nome}</h3>
          <span className="cartao-idade">{animal.idadeRotulo}</span>
        </div>
        <div className="meta">
          <span><Sexo size={14} aria-hidden="true" />{animal.sexoRotulo}</span>
          <span>Porte {animal.porteRotulo.toLowerCase()}</span>
          <span><MapPin size={14} aria-hidden="true" />{animal.abrigo.cidade}</span>
        </div>
      </div>
    </Link>
  );
}
