import type { StatusAnimal } from "@/lib/api";

export default function SeloDeSituacao({ status, rotulo }: { status: StatusAnimal; rotulo: string }) {
  return (
    <span className="selo" data-estado={status}>
      {rotulo}
    </span>
  );
}
