import { CircleAlert } from "lucide-react";

/** Rótulo, controle e mensagem de erro amarrados por id, para leitor de tela ler junto. */
export default function Campo({ id, rotulo, erro, ajuda, children }:
  { id: string; rotulo: string; erro?: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="campo" data-erro={erro ? "sim" : undefined}>
      <label className="campo-rotulo" htmlFor={id}>{rotulo}</label>
      {children}
      {erro ? (
        <span className="campo-erro" id={`${id}-erro`} role="alert">
          <CircleAlert size={13} aria-hidden="true" />{erro}
        </span>
      ) : ajuda ? (
        <span className="campo-ajuda">{ajuda}</span>
      ) : null}
    </div>
  );
}
