import type { StatusAnimal } from "@/lib/api";
import { rotuloCurto } from "@/lib/formato";

export default function SeloDeSituacao({ status, rotulo, curto = false }:
  { status: StatusAnimal; rotulo: string; curto?: boolean }) {
  return (
    <span className="selo" data-estado={status}>
      {curto ? rotuloCurto(rotulo) : rotulo}
    </span>
  );
}
