"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building, CircleCheck, Fence, HeartHandshake, House, Inbox, LoaderCircle, Mail, MapPin, PawPrint, Phone, X
} from "lucide-react";
import { api, ErroDaApi, type Candidatura } from "@/lib/api";
import { dataPorExtenso } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

const SITUACOES = [
  { chave: "", rotulo: "Todos" },
  { chave: "RECEBIDA", rotulo: "Novos" },
  { chave: "EM_ANALISE", rotulo: "Em análise" },
  { chave: "APROVADA", rotulo: "Aprovados" },
  { chave: "RECUSADA", rotulo: "Recusados" }
];

export default function Candidaturas() {
  const [pedidos, setPedidos] = useState<Candidatura[]>([]);
  const [situacao, setSituacao] = useState("");
  const [recusando, setRecusando] = useState<number | null>(null);
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
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Os pedidos não carregaram.");
    } finally {
      setCarregando(false);
    }
  }, [situacao]);

  useEffect(() => { void carregar(); }, [carregar]);

  async function executar(acao: (token: string) => Promise<unknown>, sucesso: string) {
    const sessao = lerSessao();
    if (!sessao) return false;
    setOcupado(true);
    setErro(null);
    setRecado(null);
    try {
      await acao(sessao.token);
      setRecado(sucesso);
      await carregar();
      return true;
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A operação não foi concluída.");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <h1 style={{ fontSize: "2.2rem" }}>Pedidos de adoção</h1>
          <p>Leia com calma. Aprovar um pedido reserva o animal e cancela os outros pedidos dele.</p>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="opcoes" role="group" aria-label="Situação do pedido">
          {SITUACOES.map((opcao) => (
            <button key={opcao.chave || "todos"} type="button" className="opcao" aria-pressed={situacao === opcao.chave}
                    onClick={() => setSituacao(opcao.chave)}>
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {recado && (
        <p className="aviso" data-tom="ok" role="status" style={{ marginBottom: "1rem" }}>
          <CircleCheck size={17} aria-hidden="true" /><span>{recado}</span>
        </p>
      )}
      {erro && <p className="aviso" role="alert" style={{ marginBottom: "1rem" }}>{erro}</p>}

      {carregando && pedidos.length === 0 ? (
        <div className="carregando"><LoaderCircle size={18} className="girando" aria-hidden="true" />Carregando</div>
      ) : pedidos.length === 0 ? (
        <div className="vazio">
          <Inbox size={26} aria-hidden="true" />
          <p>{situacao ? "Nenhum pedido nessa situação." : "Nenhum pedido ainda. Eles chegam pela ficha pública de cada animal."}</p>
        </div>
      ) : (
        <div className="pilha" aria-busy={carregando}>
          {pedidos.map((pedido) => {
            const aberto = pedido.status === "RECEBIDA" || pedido.status === "EM_ANALISE";
            const Moradia = pedido.moradia === "APARTAMENTO" ? Building : House;
            return (
              <article className="painel-caixa pedido" key={pedido.id} aria-labelledby={`pedido-${pedido.id}`}>
                <div className="pedido-topo">
                  <div>
                    <h3 id={`pedido-${pedido.id}`}>{pedido.nome}</h3>
                    <p className="discreto">
                      quer adotar <Link className="link-simples" href={`/painel/${pedido.animalId}`}>{pedido.animalNome}</Link>,
                      enviado em {dataPorExtenso(pedido.criadaEm)}
                    </p>
                  </div>
                  <span className="pedido-situacao" data-estado={pedido.status}>{pedido.statusRotulo}</span>
                </div>

                <div className="pedido-fatos">
                  {pedido.email && <span><Mail size={14} aria-hidden="true" /><a href={`mailto:${pedido.email}`}>{pedido.email}</a></span>}
                  {pedido.telefone && <span><Phone size={14} aria-hidden="true" />{pedido.telefone}</span>}
                  {pedido.cidade && <span><MapPin size={14} aria-hidden="true" />{pedido.cidade}</span>}
                  {pedido.moradiaRotulo && <span><Moradia size={14} aria-hidden="true" />{pedido.moradiaRotulo}</span>}
                  <span><Fence size={14} aria-hidden="true" />{pedido.areaProtegida ? "Com tela ou muro" : "Sem tela ou muro"}</span>
                  <span><PawPrint size={14} aria-hidden="true" />{pedido.temOutrosAnimais ? "Tem outros animais" : "Sem outros animais"}</span>
                </div>

                {pedido.mensagem && <p className="pedido-mensagem">{pedido.mensagem}</p>}
                {pedido.motivoDaRecusa && <p className="discreto">Motivo da recusa: {pedido.motivoDaRecusa}</p>}

                {aberto && recusando !== pedido.id && (
                  <div className="acoes">
                    <button className="botao" data-tamanho="pequeno" type="button" disabled={ocupado}
                            onClick={() => executar((token) => api.aprovar(token, pedido.id),
                                                    `Pedido de ${pedido.nome} aprovado. ${pedido.animalNome} ficou reservado.`)}>
                      <CircleCheck size={15} aria-hidden="true" />Aprovar
                    </button>
                    {pedido.status === "RECEBIDA" && (
                      <button className="botao" data-tom="neutro" data-tamanho="pequeno" type="button" disabled={ocupado}
                              onClick={() => executar((token) => api.analisar(token, pedido.id), "Pedido marcado como em análise.")}>
                        Marcar em análise
                      </button>
                    )}
                    <button className="botao" data-tom="perigo" data-tamanho="pequeno" type="button"
                            onClick={() => { setRecusando(pedido.id); setMotivo(""); }}>
                      <X size={15} aria-hidden="true" />Recusar
                    </button>
                  </div>
                )}

                {aberto && recusando === pedido.id && (
                  <form className="formulario"
                        onSubmit={async (evento) => {
                          evento.preventDefault();
                          if (await executar((token) => api.recusar(token, pedido.id, motivo.trim()), "Pedido recusado.")) {
                            setRecusando(null);
                          }
                        }}>
                    <div className="campo">
                      <label className="campo-rotulo" htmlFor={`motivo-${pedido.id}`}>Motivo da recusa</label>
                      <input id={`motivo-${pedido.id}`} value={motivo} maxLength={300} autoFocus
                             onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: o animal precisa de quintal" />
                      <span className="campo-ajuda">Quem pediu recebe esse texto. Recusa sem motivo não ajuda ninguém.</span>
                    </div>
                    <div className="acoes">
                      <button className="botao" data-tom="perigo" data-tamanho="pequeno" type="submit"
                              disabled={ocupado || motivo.trim().length === 0}>
                        Confirmar recusa
                      </button>
                      <button className="botao" data-tom="neutro" data-tamanho="pequeno" type="button" onClick={() => setRecusando(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {pedido.status === "APROVADA" && (
                  <div className="acoes">
                    <button className="botao" data-tamanho="pequeno" type="button" disabled={ocupado}
                            onClick={() => executar((token) => api.concluirAdocao(token, pedido.id),
                                                    `Adoção de ${pedido.animalNome} concluída.`)}>
                      <HeartHandshake size={15} aria-hidden="true" />Concluir adoção
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
