import { Bird, Cat, Dog, PawPrint, Rabbit, type LucideProps } from "lucide-react";
import type { Especie } from "@/lib/api";

const ICONES = { CACHORRO: Dog, GATO: Cat, COELHO: Rabbit, PASSARO: Bird, OUTRO: PawPrint };

export default function IconeDaEspecie({ especie, ...props }: { especie: Especie } & LucideProps) {
  const Icone = ICONES[especie] ?? PawPrint;
  return <Icone aria-hidden="true" {...props} />;
}
