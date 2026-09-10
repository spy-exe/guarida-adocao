"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import GraficoDeAdocoes from "@/components/GraficoDeAdocoes";
import GraficoDeEspecies from "@/components/GraficoDeEspecies";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import {
  api,
  ErroDaApi,
  type AdocoesNoMes,
  type Animal,
  type FatiaDeEspecie,
  type ResumoDoAbrigo
} from "@/lib/api";
import { data, peso, preencherMeses, rotuloCurto } from "@/lib/formato";
import { lerSessao } from "@/lib/sessao";

const SITUACOES = [
  { chave: "", rotulo: "Todos" },
  { chave: "DISPONIVEL", rotulo: "Disponiveis" },
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

  const carregar = useCallback(async () => {
    const sessao = lerSessao();
    if (!sessao) return;

    setCarregando(true);
    setErro(null);

    try {
      const [pagina, totais, porEspecie, porMes] = await Promise.all([
        api.animaisDoAbrigo(sessao.token, {
          status: situacao || undefined,
          busca: buscaAplicada || undefined,
          tamanho: 50
        }),
        api.resumo(sessao.token),
        api.especies(sessao.token),
        api.adocoesPorMes(sessao.token, 12)
      ]);

      setAnimais(pagina.itens);
      setResumo(totais);
      setEspecies(porEspecie);
      setMeses(porMes);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel carregar o painel.");
    } finally {
      setCarregando(false);
    }
  }, [situacao, buscaAplicada]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <span className="etiqueta">Acervo do abrigo</span>
          <h2>Animais</h2>
        </div>
        <div className="acoes-botoes">
          <Link className="botao" data-tom="vazado" href="/painel/candidaturas">
            Pedidos {resumo && resumo.candidaturasEmAberto > 0 ? `(${resumo.candidaturasEmAberto})` : ""}
          </Link>
          <Link className="botao" href="/painel/novo">
            Cadastrar animal
          </Link>
        </div>
      </div>

      <div className="placar">
        <div className="placar-item" data-destaque="sim">
          <strong className="numero">{resumo?.disponiveis ?? 0}</strong>
          <span className="etiqueta">esperando casa</span>
        </div>
        <div className="placar-item">
          <strong className="numero">{resumo?.emProcesso ?? 0}</strong>
          <span className="etiqueta">em processo</span>
        </div>
        <div className="placar-item">
          <strong className="numero">{resumo?.adotados ?? 0}</strong>
          <span className="etiqueta">adotados</span>
        </div>
        <div className="placar-item">
          <strong className="numero">{resumo?.candidaturasEmAberto ?? 0}</strong>
          <span className="etiqueta">pedidos em aberto</span>
        </div>
        <div className="placar-item">
          <strong className="numero">
            {(resumo?.mediaDeDiasAteAdocao ?? 0).toString().replace(".", ",")}
          </strong>
          <span className="etiqueta">dias ate adotar</span>
        </div>
      </div>

      <div className="paineis">
        <GraficoDeAdocoes meses={preencherMeses(meses, 12)} />
        <GraficoDeEspecies fatias={especies} />
      </div>

      <form
        className="barra-de-busca"
        onSubmit={(evento) => {
          evento.preventDefault();
          setBuscaAplicada(busca);
        }}
      >
        <label className="campo">
          <span>Buscar</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
                 placeholder="nome, raca ou historia" />
        </label>
        <button className="botao" data-tom="vazado" type="submit">
          Filtrar
        </button>
        {buscaAplicada && (
          <button className="botao" data-tom="vazado" type="button"
                  onClick={() => { setBusca(""); setBuscaAplicada(""); }}>
            Limpar
          </button>
        )}
      </form>

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

      {erro && <p className="aviso">{erro}</p>}

      {carregando ? (
        <p className="carregando">Carregando</p>
      ) : animais.length === 0 ? (
        <div className="vazio">
          <p>
            {situacao || buscaAplicada
              ? "Nenhum animal com esses filtros."
              : "Nenhum animal cadastrado ainda. Comece pelo primeiro."}
          </p>
          <Link className="botao" href="/painel/novo">
            Cadastrar animal
          </Link>
        </div>
      ) : (
        <div className="razao">
          {animais.map((animal, indice) => (
            <div className="razao-linha entra" key={animal.id}
                 style={{ animationDelay: `${Math.min(indice, 10) * 40}ms` }}>
              <span className="razao-id">#{animal.id}</span>

              <span className="razao-nome">
                <strong>{animal.nome}</strong>
                <span>
                  {animal.especieRotulo} · {animal.porteRotulo} · {animal.idadeRotulo} ·{" "}
                  {peso(animal.pesoEmGramas)}
                </span>
              </span>

              <span className="razao-situacao">
                <SeloDeSituacao status={animal.status} rotulo={rotuloCurto(animal.statusRotulo)} />
              </span>

              <span className="razao-id">desde {data(animal.dataDeEntrada)}</span>

              <span className="razao-acoes">
                <Link className="botao" data-tom="vazado" href={`/painel/${animal.id}`}>
                  Abrir
                </Link>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
