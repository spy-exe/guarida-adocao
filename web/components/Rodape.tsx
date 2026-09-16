const INTEGRANTES = [
  { nome: "Aline de Brito Simas", matricula: "202310031" },
  { nome: "Caio dos Santos Silva", matricula: "202310328" },
  { nome: "Mellani Lyvian de Macêdo dos Santos", matricula: "202310725" },
  { nome: "Ricardo Ribeiro de Figueiredo", matricula: "202310773" }
];

export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="rodape-miolo">
        <div>
          <span>Guarida, trabalho de Desenvolvimento de Sistema Java</span>
          <ul className="integrantes">
            {INTEGRANTES.map((pessoa) => (
              <li key={pessoa.matricula}>
                {pessoa.nome} <span className="numero">{pessoa.matricula}</span>
              </li>
            ))}
          </ul>
        </div>
        <span>
          Fotos do <a href="https://commons.wikimedia.org" target="_blank" rel="noreferrer">Wikimedia Commons</a>,
          com autor e licença indicados em cada ficha
        </span>
      </div>
    </footer>
  );
}
