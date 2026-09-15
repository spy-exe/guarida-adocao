"use client";

import { useState } from "react";
import Retrato from "@/components/Retrato";
import type { Animal } from "@/lib/api";
import { matizDoAnimal } from "@/lib/formato";

/**
 * Foto do animal, ou o retrato ilustrado quando o abrigo ainda não mandou foto
 * ou quando a imagem falha ao carregar. O texto alternativo diz quem é o bicho,
 * não "imagem de animal".
 */
export default function FotoDoAnimal({ animal, prioridade = false, tamanhos }:
  { animal: Pick<Animal, "id" | "nome" | "especie" | "especieRotulo" | "foto">; prioridade?: boolean; tamanhos?: string }) {
  const [falhou, setFalhou] = useState(false);

  if (!animal.foto || falhou) {
    return (
      <div className="retrato" style={{ background: matizDoAnimal(animal.id) }} role="img"
           aria-label={`${animal.nome}, ${animal.especieRotulo.toLowerCase()}, ainda sem foto`}>
        <Retrato especie={animal.especie} />
      </div>
    );
  }

  return (
    <img
      src={animal.foto.url}
      alt={`${animal.nome}, ${animal.especieRotulo.toLowerCase()}`}
      loading={prioridade ? "eager" : "lazy"}
      decoding="async"
      sizes={tamanhos}
      onError={() => setFalhou(true)}
    />
  );
}
