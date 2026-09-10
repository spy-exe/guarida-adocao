/**
 * O simbolo e a boca de uma toca vista de frente: arco grosso por fora, vao
 * solido por dentro. Nao e casinha com telhado triangular, que e o desenho que
 * todo petshop usa, e serve igual para cachorro, gato ou coelho.
 */
export function Simbolo({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" fill="none" aria-hidden="true"
         className="marca-simbolo">
      <path d="M6 35 V18.5 a14 14 0 0 1 28 0 V35" stroke="currentColor" strokeWidth="4.4"
            strokeLinecap="square" />
      <path d="M14.5 35 V23.5 a5.5 5.5 0 0 1 11 0 V35 Z" fill="currentColor" />
    </svg>
  );
}

export default function Marca({ complemento }: { complemento?: string }) {
  return (
    <span className="marca">
      <Simbolo />
      <span className="marca-nome">Guarida</span>
      {complemento && (
        <>
          <span className="marca-fio" aria-hidden="true" />
          <span className="marca-complemento">{complemento}</span>
        </>
      )}
    </span>
  );
}
