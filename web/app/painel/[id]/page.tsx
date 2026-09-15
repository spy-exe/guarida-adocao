"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArchiveRestore, ChevronLeft, CircleCheck, EyeOff, ExternalLink, HeartHandshake, LoaderCircle, Save, Trash2, Undo2
} from "lucide-react";
import EnvioDeFoto from "@/components/EnvioDeFoto";
import FormularioDeAnimal, { corpoDaRequisicao, dadosIniciais, type DadosDoFormulario } from "@/components/FormularioDeAnimal";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import { api, ErroDaApi, type Animal, type Candidatura, type Evento } from "@/lib/api";
import { dataPorExtenso, tempoNoAbrigo } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

export default function GerenciarAnimal() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const recemCriado = useSearchParams().get("novo") === "sim";

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pedidos, setPedidos] = useState<Candidatura[]>([]);
  const [dados, setDados] = useState<DadosDoFormulario>(() => dadosIniciais());
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(recemCriado ? "Animal cadastrado. Agora falta a foto." : null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    const sessao = lerSessao();
    if (!sessao) return;
    try {
      const [ficha, linha, fila] = await Promise.all([api.animal(id), api.eventos(id), api.candidaturasDoAnimal(sessao.token, id)]);
      setAnimal(ficha);
      setEventos(linha);
      setPedidos(fila);
      setDados(dadosIniciais(ficha));
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A ficha não carregou.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { void carregar(); }, [carregar]);

  async function executar(acao: (token: string) => Promise<unknown>, sucesso: string) {
    const sessao = lerSessao();
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    setRecado(null);
    setErros({});
    try {
      await acao(sessao.token);
      setRecado(sucesso);
      await carregar();
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(Object.keys(falha.campos).length ? "Confira os campos marcados." : falha.message);
        setErros(falha.campos);
      } else {
        setErro("A operação não foi concluída.");
      }
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    const sessao = lerSessao();
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    try {
      await api.excluirAnimal(sessao.token, id);
      router.push("/painel");
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "O cadastro não foi excluído.");
      setConfirmandoExclusao(false);
      setOcupado(false);
    }
  }

  if (carregando) {
    return <div className="carregando"><LoaderCircle size={18} className="girando" aria-hidden="true" />Carregando a ficha</div>;
  }

  if (!animal) {
    return (
      <div className="vazio">
        <p>{erro ?? "Animal não encontrado."}</p>
        <Link className="botao" href="/painel">Voltar ao acervo</Link>
      </div>
    );
  }

  const emAberto = pedidos.filter((pedido) => pedido.status === "RECEBIDA" || pedido.status === "EM_ANALISE");
  const aprovado = pedidos.find((pedido) => pedido.status === "APROVADA");
  const sessao = lerSessao();

  return (
    <>
      <nav className="migalha" aria-label="Você está em">
        <Link href="/painel"><ChevronLeft size={15} aria-hidden="true" style={{ verticalAlign: "-3px" }} />Acervo</Link>
        <span>/</span>
        <span>{animal.nome}</span>
      </nav>

      <div className="cabecalho-secao">
        <div>
          <div className="ficha-titulo" style={{ marginTop: 0 }}>
            <h1 style={{ fontSize: "2.2rem" }}>{animal.nome}</h1>
            <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} />
          </div>
          <p>{animal.especieRotulo}, {animal.idadeRotulo}, chegou {tempoNoAbrigo(animal.dataDeEntrada)}</p>
        </div>
        <Link className="botao" data-tom="neutro" href={`/animal/${animal.id}`}>
          <ExternalLink size={15} aria-hidden="true" />Ver como o público vê
        </Link>
      </div>

      {recado && (
        <p className="aviso" data-tom="ok" role="status" style={{ marginBottom: "1rem" }}>
          <CircleCheck size={17} aria-hidden="true" /><span>{recado}</span>
        </p>
      )}
      {erro && <p className="aviso" role="alert" style={{ marginBottom: "1rem" }}>{erro}</p>}

      <div className="ficha">
        <div>
          {sessao && <EnvioDeFoto key={animal.foto?.url ?? "sem-foto"} animal={animal} token={sessao.token}
                                  aoMudar={() => { setRecado("Foto atualizada."); void carregar(); }} />}

          <form className="formulario painel-caixa" noValidate
                onSubmit={(evento) => {
                  evento.preventDefault();
                  void executar((token) => api.atualizarAnimal(token, id, corpoDaRequisicao(dados, false)), "Cadastro atualizado.");
                }}>
            <h3>Cadastro</h3>
            <FormularioDeAnimal dados={dados} aoMudar={setDados} erros={erros} mostrarEntrada={false} />
            <div className="acoes">
              <button className="botao" type="submit" disabled={ocupado}>
                {ocupado ? <LoaderCircle size={16} className="girando" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                Salvar alterações
              </button>
            </div>
          </form>
        </div>

        <aside className="lateral" style={{ position: "static" }}>
          <section className="painel-caixa">
            <h3>Situação</h3>
            <p className="suave" style={{ marginBottom: "0.9rem" }}>
              {animal.status === "DISPONIVEL" && "Aparece no catálogo e recebe pedidos."}
              {animal.status === "EM_PROCESSO" && (aprovado ? `Reservado para ${aprovado.nome}.` : "Com adoção em andamento.")}
              {animal.status === "ADOTADO" && "Já foi para casa nova."}
              {animal.status === "INDISPONIVEL" && "Fora do catálogo. Pedidos novos não chegam."}
            </p>
            <div className="acoes">
              {animal.status === "DISPONIVEL" && (
                <button className="botao" data-tom="neutro" type="button" disabled={ocupado}
                        onClick={() => executar((token) => api.suspender(token, animal.id), "Tirado do catálogo.")}>
                  <EyeOff size={15} aria-hidden="true" />Tirar do catálogo
                </button>
              )}
              {animal.status === "INDISPONIVEL" && (
                <button className="botao" type="button" disabled={ocupado}
                        onClick={() => executar((token) => api.reativar(token, animal.id), "De volta ao catálogo.")}>
                  <ArchiveRestore size={15} aria-hidden="true" />Voltar ao catálogo
                </button>
              )}
              {aprovado && animal.status === "EM_PROCESSO" && (
                <button className="botao" type="button" disabled={ocupado}
                        onClick={() => executar((token) => api.concluirAdocao(token, aprovado.id), "Adoção concluída.")}>
                  <HeartHandshake size={15} aria-hidden="true" />Concluir adoção
                </button>
              )}
              {animal.status === "ADOTADO" && (
                <button className="botao" data-tom="perigo" type="button" disabled={ocupado}
                        onClick={() => executar((token) => api.devolver(token, animal.id, "Devolvido ao abrigo"), "Devolução registrada.")}>
                  <Undo2 size={15} aria-hidden="true" />Registrar devolução
                </button>
              )}
            </div>
          </section>

          {emAberto.length > 0 && (
            <section className="painel-caixa">
              <h3>Pedidos em aberto</h3>
              <div className="pilha">
                {emAberto.map((pedido) => (
                  <div key={pedido.id} className="pedido">
                    <div className="pedido-topo">
                      <div>
                        <strong>{pedido.nome}</strong>
                        <p className="discreto">{[pedido.cidade, pedido.moradiaRotulo].filter(Boolean).join(", ")}</p>
                      </div>
                      <span className="pedido-situacao" data-estado={pedido.status}>{pedido.statusRotulo}</span>
                    </div>
                    <div className="acoes">
                      <button className="botao" data-tamanho="pequeno" type="button" disabled={ocupado}
                              onClick={() => executar((token) => api.aprovar(token, pedido.id), `Pedido de ${pedido.nome} aprovado.`)}>
                        Aprovar
                      </button>
                      <Link className="botao" data-tom="neutro" data-tamanho="pequeno" href="/painel/candidaturas">Ler o pedido</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="painel-caixa">
            <h3>Linha do tempo</h3>
            <ol className="linha-do-tempo">
              {eventos.map((evento, indice) => (
                <li className="momento" data-tipo={evento.tipo} key={`${evento.tipo}-${indice}`}>
                  <span className="momento-ponto" aria-hidden="true" />
                  <strong>{evento.tipoRotulo}</strong>
                  <time dateTime={evento.acontecido}>{dataPorExtenso(evento.acontecido)}</time>
                  {evento.descricao !== evento.tipoRotulo && <p>{evento.descricao}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="painel-caixa">
            <h3>Excluir cadastro</h3>
            <p className="discreto" style={{ margin: "0.4rem 0 0.9rem" }}>
              Some junto a linha do tempo e os pedidos. Animal adotado não pode ser excluído, porque o registro da adoção
              se perderia. Nesse caso, registre a devolução.
            </p>
            {confirmandoExclusao ? (
              <div className="acoes">
                <button className="botao" data-tom="perigo" type="button" disabled={ocupado} onClick={excluir}>
                  <Trash2 size={15} aria-hidden="true" />Excluir {animal.nome} de vez
                </button>
                <button className="botao" data-tom="neutro" type="button" onClick={() => setConfirmandoExclusao(false)}>Cancelar</button>
              </div>
            ) : (
              <button className="botao" data-tom="perigo" type="button" onClick={() => setConfirmandoExclusao(true)}>
                <Trash2 size={15} aria-hidden="true" />Excluir animal
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
