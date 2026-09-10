"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FormularioDeAnimal, {
  corpoDaRequisicao,
  dadosIniciais,
  type DadosDoFormulario
} from "@/components/FormularioDeAnimal";
import LinhaFicha from "@/components/LinhaFicha";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import { api, ErroDaApi, type Animal, type Candidatura, type Evento } from "@/lib/api";
import { data, peso } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

export default function GerenciarAnimal() {
  const parametros = useParams<{ id: string }>();
  const id = parametros.id;
  const router = useRouter();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pedidos, setPedidos] = useState<Candidatura[]>([]);
  const [dados, setDados] = useState<DadosDoFormulario>(dadosIniciais());
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    const sessao = lerSessao();
    if (!sessao) return;

    try {
      const [ficha, linha, fila] = await Promise.all([
        api.animal(id),
        api.eventos(id),
        api.candidaturasDoAnimal(sessao.token, id)
      ]);
      setAnimal(ficha);
      setEventos(linha);
      setPedidos(fila);
      setDados(dadosIniciais(ficha));
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel carregar o animal.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    const sessao = lerSessao();
    if (!sessao) return;

    setOcupado(true);
    setErro(null);
    setRecado(null);
    setCampos({});

    try {
      await acao();
      setRecado(sucesso);
      await carregar();
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(falha.message);
        setCampos(falha.campos);
      } else {
        setErro("A operacao nao foi concluida.");
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
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel excluir.");
      setConfirmandoExclusao(false);
      setOcupado(false);
    }
  }

  if (carregando) return <p className="carregando">Carregando</p>;

  if (!animal) {
    return (
      <div className="vazio">
        <p>{erro ?? "Animal nao encontrado."}</p>
        <Link className="botao" href="/painel">
          Voltar
        </Link>
      </div>
    );
  }

  const emAberto = pedidos.filter((pedido) =>
    pedido.status === "RECEBIDA" || pedido.status === "EM_ANALISE");
  const aprovada = pedidos.find((pedido) => pedido.status === "APROVADA");

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <span className="etiqueta">
            <Link href="/painel">Animais</Link> / ficha {animal.id}
          </span>
          <h2>{animal.nome}</h2>
        </div>
        <div className="acoes-botoes">
          <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} />
          <Link className="botao" data-tom="vazado" href={`/animal/${animal.id}`}>
            Ver no catalogo
          </Link>
        </div>
      </div>

      {recado && <p className="aviso" data-tom="ok" style={{ marginBottom: "1rem" }}>{recado}</p>}
      {erro && <p className="aviso" style={{ marginBottom: "1rem" }}>{erro}</p>}

      <div className="ficha">
        <div style={{ display: "grid", gap: "1.3rem" }}>
          <section className="caixa-lateral">
            <h3>Situacao</h3>
            <LinhaFicha rotulo="Entrada" valor={data(animal.dataDeEntrada)} />
            <LinhaFicha rotulo="Idade" valor={animal.idadeRotulo} />
            <LinhaFicha rotulo="Peso" valor={peso(animal.pesoEmGramas)} />
            <LinhaFicha rotulo="Pedidos" valor={String(pedidos.length)} />

            <div className="acoes-botoes">
              {animal.status === "DISPONIVEL" && (
                <button className="botao" data-tom="vazado" type="button" disabled={ocupado}
                        onClick={() => executar(
                          () => api.suspender(lerSessao()!.token, animal.id),
                          "Animal retirado da vitrine.")}>
                  Tirar da vitrine
                </button>
              )}
              {animal.status === "INDISPONIVEL" && (
                <button className="botao" type="button" disabled={ocupado}
                        onClick={() => executar(
                          () => api.reativar(lerSessao()!.token, animal.id),
                          "Animal de volta a vitrine.")}>
                  Devolver a vitrine
                </button>
              )}
              {aprovada && animal.status === "EM_PROCESSO" && (
                <button className="botao" type="button" disabled={ocupado}
                        onClick={() => executar(
                          () => api.concluirAdocao(lerSessao()!.token, aprovada.id),
                          "Adocao concluida.")}>
                  Concluir adocao com {aprovada.nome}
                </button>
              )}
              {animal.status === "ADOTADO" && (
                <button className="botao" data-tom="risco" type="button" disabled={ocupado}
                        onClick={() => executar(
                          () => api.devolver(lerSessao()!.token, animal.id, "Devolvido ao abrigo"),
                          "Devolucao registrada.")}>
                  Registrar devolucao
                </button>
              )}
            </div>
          </section>

          {emAberto.length > 0 && (
            <section className="caixa-lateral">
              <h3>Pedidos em aberto</h3>
              {emAberto.map((pedido) => (
                <div key={pedido.id} style={{ borderTop: "1px solid var(--borda)", paddingTop: "0.8rem" }}>
                  <strong>{pedido.nome}</strong>
                  <p className="etiqueta">
                    {pedido.cidade} · {pedido.moradiaRotulo} · {pedido.statusRotulo}
                  </p>
                  <div className="acoes-botoes" style={{ marginTop: "0.6rem" }}>
                    <button className="botao" type="button" disabled={ocupado}
                            onClick={() => executar(
                              () => api.aprovar(lerSessao()!.token, pedido.id),
                              `Pedido de ${pedido.nome} aprovado.`)}>
                      Aprovar
                    </button>
                    <Link className="botao" data-tom="vazado" href="/painel/candidaturas">
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="caixa-lateral">
            <h3>Linha do tempo</h3>
            <div className="linha-do-tempo" style={{ border: 0, padding: 0 }}>
              {eventos.map((evento, indice) => (
                <div className="momento" key={`${evento.tipo}-${indice}`}>
                  <div>
                    <strong>{evento.tipoRotulo}</strong>
                    <time dateTime={evento.acontecido}>{data(evento.acontecido)}</time>
                  </div>
                  <p>{evento.descricao}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="caixa-lateral">
            <h3>Excluir cadastro</h3>
            <p>
              A exclusao leva junto a linha do tempo e os pedidos. Animal ja adotado nao pode ser
              excluido, porque o registro da adocao se perderia: nesse caso registre a devolucao.
            </p>
            {confirmandoExclusao ? (
              <div className="acoes-botoes">
                <button className="botao" data-tom="risco" type="button" disabled={ocupado}
                        onClick={excluir}>
                  Confirmar exclusao de {animal.nome}
                </button>
                <button className="botao" data-tom="vazado" type="button"
                        onClick={() => setConfirmandoExclusao(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="botao" data-tom="risco" type="button"
                      onClick={() => setConfirmandoExclusao(true)}>
                Excluir animal
              </button>
            )}
          </section>
        </div>

        <form
          className="formulario"
          onSubmit={(evento) => {
            evento.preventDefault();
            void executar(
              () => api.atualizarAnimal(lerSessao()!.token, id, corpoDaRequisicao(dados, false)),
              "Cadastro atualizado.");
          }}
        >
          <h3>Alterar cadastro</h3>
          <FormularioDeAnimal dados={dados} aoMudar={setDados} campos={campos}
                              mostrarEntrada={false} idParaRetrato={animal.id} />

          <button className="botao" type="submit" disabled={ocupado}>
            {ocupado ? "Salvando" : "Salvar alteracoes"}
          </button>
        </form>
      </div>
    </>
  );
}
