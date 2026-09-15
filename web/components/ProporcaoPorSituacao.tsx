import type { ResumoDoAbrigo } from "@/lib/api";

/*
  Uma barra de proporção no lugar de cinco quadradinhos de número. O abrigo
  entende de uma vez quanto do acervo está esperando, quanto já saiu e quanto
  está parado, e os números exatos ficam na legenda.
*/
const PARTES = [
  { chave: "disponiveis", rotulo: "Esperando casa", cor: "var(--disponivel)" },
  { chave: "emProcesso", rotulo: "Em processo", cor: "var(--em-processo)" },
  { chave: "adotados", rotulo: "Adotados", cor: "var(--adotado)" },
  { chave: "indisponiveis", rotulo: "Fora da vitrine", cor: "var(--indisponivel)" }
] as const;

export default function ProporcaoPorSituacao({ resumo }: { resumo: ResumoDoAbrigo }) {
  const presentes = PARTES.filter((parte) => resumo[parte.chave] > 0);

  return (
    <section className="painel-caixa" aria-labelledby="titulo-acervo">
      <h3 id="titulo-acervo" className="apenas-leitor">Acervo por situação</h3>
      <div className="resumo-total">
        <strong>{resumo.total}</strong>
        <span className="suave">{resumo.total === 1 ? "animal no acervo" : "animais no acervo"}</span>
      </div>

      {resumo.total > 0 && (
        <div className="proporcao" role="img"
             aria-label={presentes.map((parte) => `${resumo[parte.chave]} ${parte.rotulo.toLowerCase()}`).join(", ")}>
          {presentes.map((parte) => (
            <span key={parte.chave} style={{ flex: resumo[parte.chave], background: parte.cor }} />
          ))}
        </div>
      )}

      <div className="legenda">
        {PARTES.map((parte) => (
          <span className="legenda-item" key={parte.chave}>
            <i style={{ background: parte.cor }} aria-hidden="true" />
            {parte.rotulo} <strong>{resumo[parte.chave]}</strong>
          </span>
        ))}
      </div>

      {resumo.mediaDeDiasAteAdocao > 0 && (
        <p className="discreto" style={{ marginTop: "0.9rem" }}>
          Em média, um animal leva {Math.round(resumo.mediaDeDiasAteAdocao)} dias entre chegar e ser adotado.
        </p>
      )}
    </section>
  );
}
