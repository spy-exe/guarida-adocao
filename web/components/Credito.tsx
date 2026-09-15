import { Camera } from "lucide-react";
import type { Foto } from "@/lib/api";

/** Atribuição da foto: autor, licença e link para a origem, como a licença pede. */
export default function Credito({ foto }: { foto?: Foto }) {
  if (!foto || (!foto.autor && !foto.licenca)) return null;

  return (
    <p className="credito">
      <Camera size={13} aria-hidden="true" />
      <span>Foto de {foto.autor ?? "autor não informado"}</span>
      {foto.licenca && <span>· {foto.licenca}</span>}
      {foto.fonte && /^https?:\/\//i.test(foto.fonte) && (
        <>
          <span>·</span>
          <a href={foto.fonte} target="_blank" rel="noreferrer">ver original</a>
        </>
      )}
    </p>
  );
}
