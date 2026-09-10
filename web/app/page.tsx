"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CartaoDeAnimal from "@/components/CartaoDeAnimal";
import Marca from "@/components/Marca";
import PlaquinhaDeColeira from "@/components/PlaquinhaDeColeira";
import { api, ErroDaApi, type Animal } from "@/lib/api";

const ESPECIES = [
  { chave: "", rotulo: "Todos" },
  { chave: "CACHORRO", rotulo: "Cachorros" },
  { chave: "GATO", rotulo: "Gatos" },
  { chave: "COELHO", rotulo: "Coelhos" },
  { chave: "PASSARO", rotulo: "Passaros" }
];

const PORTES = [
  { chave: "", rotulo: "Qualquer porte" },
  { chave: "PEQUENO", rotulo: "Pequeno" },
  { chave: "MEDIO", rotulo: "Medio" },
  { chave: "GRANDE", rotulo: "Grande" }
];

export default function Catalogo() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [disponiveis, setDisponiveis] = useState(0);
  const [adotados, setAdotados] = useState(0);
  const [especie, setEspecie] = useState("");
  const [porte, setPorte] = useState("");
  const [apenasFilhotes, setApenasFilhotes] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const [pagina, comDisponiveis, comAdotados] = await Promise.all([
        api.catalogo({
          especie: especie || undefined,
          porte: porte || undefined,
          apenasFilhotes: apenasFilhotes || undefined,
          busca: buscaAplicada || undefined,
          status: "DISPONIVEL",
          tamanho: 24
        }),
        api.catalogo({ status: "DISPONIVEL", tamanho: 1 }),
        api.catalogo({ status: "ADOTADO", tamanho: 1 })
      ]);

      setAnimais(pagina.itens);
      setTotal(pagina.totalDeItens);
      setDisponiveis(comDisponiveis.totalDeItens);
      setAdotados(comAdotados.totalDeItens);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel carregar o catalogo.");
    } finally {
      setCarregando(false);
    }
  }, [especie, porte, apenasFilhotes, buscaAplicada]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <header className="topo">
        <Link href="/">
          <Marca complemento="abrigo e adocao" />
        </Link>
        <nav className="topo-nav">
          <a href="/swagger-ui.html">API</a>
          <Link className="botao" data-tom="vazado" href="/entrar">
            Entrar como abrigo
          </Link>
        </nav>
      </header>

      <main className="corpo">
        <section className="vitrine">
          <div className="vitrine-texto">
            <span className="etiqueta entra">Adocao responsavel</span>
            <h1 className="entra" style={{ animationDelay: "70ms" }}>
              Todo bicho daqui tem nome, ficha e historia.
            </h1>
            <p className="entra" style={{ animationDelay: "140ms" }}>
              Cada animal chega com data de entrada, peso, vacina e temperamento anotados. Voce escolhe
              pelo que combina com a sua casa, manda um pedido e o abrigo responde.
            </p>

            <div className="vitrine-numeros entra" style={{ animationDelay: "210ms" }}>
              <div className="vitrine-numero">
                <strong className="numero">{disponiveis}</strong>
                <span>esperando casa</span>
              </div>
              <div className="vitrine-numero">
                <strong className="numero">{adotados}</strong>
                <span>ja adotados</span>
              </div>
            </div>
          </div>

          <div className="vitrine-palco">
            <PlaquinhaDeColeira nome="Guarida" linhaDeBaixo="abrigo e adocao" altura={340} />
            <p className="dica-arraste">Arraste a plaquinha</p>
          </div>
        </section>

        <div className="cabecalho-secao">
          <div>
            <span className="etiqueta">Disponiveis agora</span>
            <h2>Quem esta esperando</h2>
          </div>
          <span className="etiqueta">{total} no filtro</span>
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
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="nome, raca ou historia"
            />
          </label>

          <label className="campo">
            <span>Porte</span>
            <select value={porte} onChange={(evento) => setPorte(evento.target.value)}>
              {PORTES.map((opcao) => (
                <option key={opcao.chave || "qualquer"} value={opcao.chave}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </label>

          <button className="botao" data-tom="vazado" type="submit">
            Filtrar
          </button>

          <button
            className="filtro"
            type="button"
            data-ativo={apenasFilhotes ? "sim" : "nao"}
            onClick={() => setApenasFilhotes((atual) => !atual)}
          >
            So filhotes
          </button>
        </form>

        <div className="filtros">
          {ESPECIES.map((opcao) => (
            <button
              key={opcao.chave || "todos"}
              className="filtro"
              type="button"
              data-ativo={especie === opcao.chave ? "sim" : "nao"}
              onClick={() => setEspecie(opcao.chave)}
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
              Nenhum animal com esses filtros agora. Tire um filtro ou volte outro dia: a lista muda
              toda semana.
            </p>
          </div>
        ) : (
          <div className="grade">
            {animais.map((animal, indice) => (
              <CartaoDeAnimal animal={animal} indice={indice} key={animal.id} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
