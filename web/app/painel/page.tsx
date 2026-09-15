"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, LoaderCircle, Plus, Search, SearchX } from "lucide-react";
import FotoDoAnimal from "@/components/FotoDoAnimal";
import GraficoDeAdocoes from "@/components/GraficoDeAdocoes";
import GraficoDeEspecies from "@/components/GraficoDeEspecies";
import ProporcaoPorSituacao from "@/components/ProporcaoPorSituacao";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import { api, ErroDaApi, type AdocoesNoMes, type Animal, type FatiaDeEspecie, type ResumoDoAbrigo } from "@/lib/api";
import { preencherMeses, tempoNoAbrigo } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

const SITUACOES = [
  { chave: "", rotulo: "Todos" },
  { chave: "DISPONIVEL", rotulo: "Esperando casa" },
  { chave: "EM_PROCESSO", rotulo: "Em processo" },
  { chave: "ADOTADO", rotulo: "Adotados" },
  { chave: "INDISPONIVEL", rotulo: "Fora da vitrine" }
];

export default function Painel() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [resumo, setResumo] = useState<ResumoDoAbrigo | null>(null);
  const [especies, setEspecies] = useState<FatiaDeEspecie[]>([]);
  const [meses, setMeses] = useState<AdocoesNoMes[]>([]);
  const [situacao, setSituacao] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // números e gráficos não mudam com o filtro da lista, então carregam uma vez só
  useEffect(() => {
    const sessao = lerSessao();
    if (!sessao) return;
    Promise.all([api.resumo(sessao.token), api.especies(sessao.token), api.adocoesPorMes(sessao.token, 12)])
      .then(([totais, porEspecie, porMes]) => { setResumo(totais); setEspecies(porEspecie); setMeses(porMes); })
      .catch((falha) => setErro(falha instanceof ErroDaApi ? falha.message : "O resumo do abrigo não carregou."));
  }, []);

  const carregarLista = useCallback(async () => {
    const sessao = lerSessao();
    if (!sessao) return;
    setCarregando(true);
    try {
      const pagina = await api.animaisDoAbrigo(sessao.token, { status: situacao || undefined,
                                                              busca: buscaAplicada || undefined, tamanho: 50 });
      setAnimais(pagina.itens);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A lista de animais não carregou.");
    } finally {
      setCarregando(false);
    }
  }, [situacao, buscaAplicada]);

  useEffect(() => { void carregarLista(); }, [carregarLista]);

  const pedidos = resumo?.candidaturasEmAberto ?? 0;
  const filtrando = Boolean(situacao || buscaAplicada);

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <h1 style={{ fontSize: "2.2rem" }}>Acervo</h1>
          <p>Quem está com vocês, quem já foi e o que falta resolver.</p>
        </div>
        <Link className="botao" href="/painel/novo"><Plus size={16} aria-hidden="true" />Cadastrar animal</Link>
      </div>

      {resumo && (
        <div className="resumo">
          <ProporcaoPorSituacao resumo={resumo} />
          <div className="chamada" data-vazia={pedidos === 0 ? "sim" : undefined}>
            <div>
              <strong>{pedidos}</strong>
              {pedidos === 0
                ? "Nenhum pedido esperando resposta."
                : pedidos === 1 ? "pedido esperando resposta" : "pedidos esperando resposta"}
            </div>
            {pedidos > 0 && (
              <Link className="botao" data-tamanho="pequeno" href="/painel/candidaturas">
                <Inbox size={15} aria-hidden="true" />Responder
              </Link>
            )}
          </div>
        </div>
      )}

      {resumo && (
        <div className="graficos">
          <GraficoDeAdocoes meses={preencherMeses(meses, 12)} />
          <GraficoDeEspecies fatias={especies} />
        </div>
      )}

      <div className="barra-filtros">
        <form className="busca-grande" data-tamanho="compacto" role="search"
              onSubmit={(evento) => { evento.preventDefault(); setBuscaAplicada(busca.trim()); }}>
          <Search size={16} aria-hidden="true" color="var(--tinta-3)" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar no acervo"
                 placeholder="Nome, raça ou história" />
        </form>
        <div className="opcoes" role="group" aria-label="Situação">
          {SITUACOES.map((opcao) => (
            <button key={opcao.chave || "todos"} type="button" className="opcao" aria-pressed={situacao === opcao.chave}
                    onClick={() => setSituacao(opcao.chave)}>
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {erro && <p className="aviso" role="alert" style={{ marginBottom: "1rem" }}>{erro}</p>}

      {carregando && animais.length === 0 ? (
        <div className="carregando"><LoaderCircle size={18} className="girando" aria-hidden="true" />Carregando</div>
      ) : animais.length === 0 ? (
        <div className="vazio">
          <SearchX size={26} aria-hidden="true" />
          <p>{filtrando ? "Nenhum animal com esses filtros." : "Nenhum animal cadastrado ainda. Comece pelo primeiro."}</p>
          {filtrando ? (
            <button className="botao" data-tom="neutro" type="button"
                    onClick={() => { setSituacao(""); setBusca(""); setBuscaAplicada(""); }}>
              Limpar filtros
            </button>
          ) : (
            <Link className="botao" href="/painel/novo"><Plus size={16} aria-hidden="true" />Cadastrar animal</Link>
          )}
        </div>
      ) : (
        <div className="tabela" aria-busy={carregando}>
          {animais.map((animal) => (
            <Link className="linha" key={animal.id} href={`/painel/${animal.id}`}>
              <span className="miniatura"><FotoDoAnimal animal={animal} /></span>
              <span className="linha-nome">
                <strong>{animal.nome}</strong>
                <span>{[animal.raca ?? animal.especieRotulo, animal.sexoRotulo.toLowerCase(), animal.idadeRotulo].join(", ")}</span>
              </span>
              <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} curto />
              <span className="linha-data">chegou {tempoNoAbrigo(animal.dataDeEntrada)}</span>
              <ChevronRight size={18} aria-hidden="true" color="var(--tinta-3)" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
