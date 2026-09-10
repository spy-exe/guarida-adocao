export default function LinhaFicha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="linha-ficha">
      <span className="rotulo">{rotulo}</span>
      <span className="pontilhado" aria-hidden="true" />
      <span className="valor">{valor}</span>
    </div>
  );
}
