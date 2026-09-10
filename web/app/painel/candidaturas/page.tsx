"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LinhaFicha from "@/components/LinhaFicha";
import { api, ErroDaApi, type Candidatura } from "@/lib/api";
import { data } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

const SITUACOES = [
  { chave: "", rotulo: "Todos" },
  { chave: "RECEBIDA", rotulo: "Recebidos" },
  { chave: "EM_ANALISE", rotulo: "Em analise" },
  { chave: "APROVADA", rotulo: "Aprovados" },
  { chave: "RECUSADA", rotulo: "Recusados" }
];

const CORES: Record<string, string> = {
  RECEBIDA: "var(--em-processo)",
  EM_ANALISE: "var(--em-processo)",
  APROVADA: "var(--disponivel)",
  RECUSADA: "var(--terracota)",
  CANCELADA: "var(--indisponivel)"
};

export default function Candidaturas() {
  const [pedidos, setPedidos] = useState<Candidatura[]>([]);
  const [situacao, setSituacao] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const sessao = lerSessao();
    if (!sessao) return;

    setCarregando(true);
    try {
      const pagina = await api.candidaturas(sessao.token, situacao || undefined);
      setPedidos(pagina.itens);
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel carregar os pedidos.");
    } finally {
      setCarregando(false);
    }
  }, [situacao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setOcupado(true);
    setErro(null);
    setRecado(null);

    try {
      await acao();
      setRecado(sucesso);
      await carregar();
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A operacao nao foi concluida.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <span className="etiqueta">Quem quer adotar</span>
          <h2>Pedidos</h2>
        </div>
        <Link className="botao" data-tom="vazado" href="/painel">
          Animais
        </Link>
      </div>

      <div className="filtros">
        {SITUACOES.map((opcao) => (
          <button
            key={opcao.chave || "todos"}
            className="filtro"
            type="button"
            data-ativo={situacao === opcao.chave ? "sim" : "nao"}
            onClick={() => setSituacao(opcao.chave)}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      {recado && <p className="aviso" data-tom="ok" style={{ marginBottom: "1rem" }}>{recado}</p>}
      {erro && <p className="aviso" style={{ marginBottom: "1rem" }}>{erro}</p>}

      {carregando ? (
        <p className="carregando">Carregando</p>
      ) : pedidos.length === 0 ? (
        <div className="vazio">
          <p>
            {situacao
              ? "Nenhum pedido com essa situacao."
              : "Nenhum pedido ainda. Eles chegam pelo catalogo publico."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {pedidos.map((pedido, indice) => (
            <article className="caixa-lateral entra" key={pedido.id}
                     style={{ animationDelay: `${Math.min(indice, 10) * 40}ms` }}>
              <header style={{ display: "flex", justifyContent: "space-between", gap: "1rem",
                               alignItems: "flex-start" }}>
                <div>
                  <h3>{pedido.nome}</h3>
                  <span className="etiqueta">
                    quer adotar{" "}
                    <Link href={`/painel/${pedido.animalId}`}>{pedido.animalNome}</Link>
                    {" · "}
                    {data(pedido.criadaEm)}
                  </span>
                </div>
                <span className="selo" style={{ color: CORES[pedido.status] }}>
                  {pedido.statusRotulo}
                </span>
              </header>

              <LinhaFicha rotulo="Contato" valor={`${pedido.email ?? ""} · ${pedido.telefone ?? ""}`} />
              <LinhaFicha rotulo="Cidade" valor={pedido.cidade ?? ""} />
              <LinhaFicha rotulo="Moradia" valor={pedido.moradiaRotulo ?? ""} />
              <LinhaFicha rotulo="Area protegida" valor={pedido.areaProtegida ? "sim" : "nao"} />
              <LinhaFicha rotulo="Outros animais" valor={pedido.temOutrosAnimais ? "sim" : "nao"} />

              {pedido.mensagem && <p>{pedido.mensagem}</p>}

              {pedido.motivoDaRecusa && (
                <p className="aviso">Recusado: {pedido.motivoDaRecusa}</p>
              )}

              {(pedido.status === "RECEBIDA" || pedido.status === "EM_ANALISE") && (
                <>
                  <div className="acoes-botoes">
                    {pedido.status === "RECEBIDA" && (
                      <button className="botao" data-tom="vazado" type="button" disabled={ocupado}
                              onClick={() => executar(
                                () => api.analisar(lerSessao()!.token, pedido.id),
                                "Pedido marcado como em analise.")}>
                        Colocar em analise
                      </button>
                    )}
                    <button className="botao" type="button" disabled={ocupado}
                            onClick={() => executar(
                              () => api.aprovar(lerSessao()!.token, pedido.id),
                              `Pedido de ${pedido.nome} aprovado. ${pedido.animalNome} foi reservado.`)}>
                      Aprovar
                    </button>
                    <button className="botao" data-tom="risco" type="button"
                            onClick={() => { setAberto(aberto === pedido.id ? null : pedido.id);
                                             setMotivo(""); }}>
                      Recusar
                    </button>
                  </div>

                  {aberto === pedido.id && (
                    <div style={{ display: "grid", gap: "0.7rem" }}>
                      <label className="campo">
                        <span>Motivo da recusa</span>
                        <input value={motivo} onChange={(e) => setMotivo(e.target.value)}
                               placeholder="O que faltou para este pedido" />
                      </label>
                      <p className="etiqueta">
                        Recusa sem motivo nao ajuda quem recebeu, entao o campo e obrigatorio.
                      </p>
                      <div className="acoes-botoes">
                        <button className="botao" data-tom="risco" type="button"
                                disabled={ocupado || motivo.trim().length === 0}
                                onClick={() => executar(
                                  () => api.recusar(lerSessao()!.token, pedido.id, motivo),
                                  "Pedido recusado.").then(() => setAberto(null))}>
                          Confirmar recusa
                        </button>
                        <button className="botao" data-tom="vazado" type="button"
                                onClick={() => setAberto(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {pedido.status === "APROVADA" && (
                <div className="acoes-botoes">
                  <button className="botao" type="button" disabled={ocupado}
                          onClick={() => executar(
                            () => api.concluirAdocao(lerSessao()!.token, pedido.id),
                            `Adocao de ${pedido.animalNome} concluida.`)}>
                    Concluir adocao
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
