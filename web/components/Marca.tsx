/**
 * O símbolo é a boca de uma toca vista de frente: arco grosso por fora, vão
 * sólido por dentro. Não é casinha com telhado, que todo petshop usa.
 */
export function Simbolo({ tamanho = 24 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M6 35 V18.5 a14 14 0 0 1 28 0 V35" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" />
      <path d="M14.5 35 V23.5 a5.5 5.5 0 0 1 11 0 V35 Z" fill="currentColor" />
    </svg>
  );
}

export default function Marca({ complemento }: { complemento?: string }) {
  return (
    <span className="marca">
      <Simbolo />
      <span className="marca-nome">Guarida</span>
      {complemento && <span className="marca-complemento">{complemento}</span>}
    </span>
  );
}
