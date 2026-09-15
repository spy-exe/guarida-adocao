"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Baby, Building2, HeartHandshake, LoaderCircle, PawPrint, Search, SearchX } from "lucide-react";
import CartaoDeAnimal from "@/components/CartaoDeAnimal";
import IconeDaEspecie from "@/components/IconeDaEspecie";
import Rodape from "@/components/Rodape";
import Topo from "@/components/Topo";
import { api, ErroDaApi, type Animal, type Especie } from "@/lib/api";
import { tempoNoAbrigo } from "@/lib/formato";

const ESPECIES: Array<{ chave: "" | Especie; rotulo: string }> = [
  { chave: "", rotulo: "Todos" },
  { chave: "CACHORRO", rotulo: "Cães" },
  { chave: "GATO", rotulo: "Gatos" },
  { chave: "COELHO", rotulo: "Coelhos" },
  { chave: "PASSARO", rotulo: "Aves" }
];

/** useSearchParams exige Suspense para a página poder ser pré-renderizada. */
export default function PaginaInicial() {
  return (
    <Suspense fallback={null}>
      <Catalogo />
    </Suspense>
  );
}

function Catalogo() {
  const router = useRouter();
  const parametros = useSearchParams();

  const especie = (parametros.get("especie") ?? "") as "" | Especie;
  const porte = parametros.get("porte") ?? "";
  const filhotes = parametros.get("filhotes") === "sim";
  const busca = parametros.get("busca") ?? "";

  const [texto, setTexto] = useState(busca);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [numeros, setNumeros] = useState({ esperando: 0, adotados: 0 });
  const [destaques, setDestaques] = useState<Animal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  /** Filtro vive na URL: dá para voltar, recarregar e mandar o link para alguém. */
  const filtrar = useCallback((mudancas: Record<string, string>) => {
    const proximos = new URLSearchParams(parametros.toString());
    Object.entries(mudancas).forEach(([chave, valor]) => (valor ? proximos.set(chave, valor) : proximos.delete(chave)));
    router.replace(`/?${proximos}`, { scroll: false });
  }, [parametros, router]);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    api.catalogo({ especie: especie || undefined, porte: porte || undefined, apenasFilhotes: filhotes || undefined,
                   busca: busca || undefined, status: "DISPONIVEL", tamanho: 24 })
      .then((pagina) => {
        if (!ativo) return;
        setAnimais(pagina.itens);
        setTotal(pagina.totalDeItens);
      })
      .catch((falha) => ativo && setErro(falha instanceof ErroDaApi ? falha.message : "O catálogo não carregou."))
      .finally(() => ativo && setCarregando(false));

    return () => { ativo = false; };
  }, [especie, porte, filhotes, busca]);

  useEffect(() => {
    Promise.all([
      api.catalogo({ status: "DISPONIVEL", tamanho: 60 }),
      api.catalogo({ status: "ADOTADO", tamanho: 1 })
    ]).then(([disponiveis, adotados]) => {
      setNumeros({ esperando: disponiveis.totalDeItens, adotados: adotados.totalDeItens });
      // a lista abaixo começa pelos que chegaram agora; o destaque fica com quem espera há mais tempo
      setDestaques(disponiveis.itens.filter((animal) => animal.foto)
        .sort((a, b) => a.dataDeEntrada.localeCompare(b.dataDeEntrada))
        .slice(0, 3));
    }).catch(() => undefined);
  }, []);

  const tituloDaLista = useMemo(() => {
    if (busca) return `Resultados para “${busca}”`;
    const escolhida = ESPECIES.find((opcao) => opcao.chave === especie);
    return especie && escolhida ? `${escolhida.rotulo} esperando casa` : "Esperando casa";
  }, [busca, especie]);

  const [principal, ...laterais] = destaques;

  return (
    <>
      <Topo complemento="adoção de animais">
        <a className="topo-link" href="/swagger-ui.html"><span>API</span></a>
        <Link className="botao" data-tom="neutro" data-tamanho="pequeno" href="/entrar">
          <Building2 size={15} aria-hidden="true" />Sou de um abrigo
        </Link>
      </Topo>

      <main className="corpo">
        <section className="vitrine">
          <div className="vitrine-texto">
            <h1>Adote um bicho que já tem nome e história.</h1>
            <p>
              Cada animal aqui tem ficha com idade, vacinas e jeito de ser anotados por quem cuida dele.
              Escolha pelo que combina com a sua casa e mande um pedido. Não precisa criar conta.
            </p>

            <form className="busca-grande" role="search"
                  onSubmit={(evento) => { evento.preventDefault(); filtrar({ busca: texto.trim() }); }}>
              <Search size={18} aria-hidden="true" color="var(--tinta-3)" />
              <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar por nome, raça ou história"
                     placeholder="Nome, raça ou algo da história" />
              <button className="botao" type="submit">Buscar</button>
            </form>

            <div className="fatos">
              <span className="fato"><PawPrint size={16} aria-hidden="true" /><strong className="numero">{numeros.esperando}</strong> esperando casa</span>
              <span className="fato"><HeartHandshake size={16} aria-hidden="true" /><strong className="numero">{numeros.adotados}</strong> já adotados</span>
            </div>
          </div>

          <div className="mosaico" aria-hidden={destaques.length === 0}>
            {principal ? (
              <>
                <Link className="mosaico-item" href={`/animal/${principal.id}`}>
                  <img src={principal.foto!.url} alt={`${principal.nome}, ${principal.especieRotulo.toLowerCase()}`} />
                  <span className="mosaico-legenda"><strong>{principal.nome}</strong>, esperando {tempoNoAbrigo(principal.dataDeEntrada)}</span>
                </Link>
                {laterais.map((animal) => (
                  <Link className="mosaico-item" key={animal.id} href={`/animal/${animal.id}`}>
                    <img src={animal.foto!.url} alt={`${animal.nome}, ${animal.especieRotulo.toLowerCase()}`} loading="lazy" />
                    <span className="mosaico-legenda"><strong>{animal.nome}</strong>, {tempoNoAbrigo(animal.dataDeEntrada)}</span>
                  </Link>
                ))}
              </>
            ) : (
              <>
                <div className="mosaico-item esqueleto" />
                <div className="mosaico-item esqueleto" />
                <div className="mosaico-item esqueleto" />
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="titulo-lista">
          <div className="cabecalho-secao">
            <div>
              <h2 id="titulo-lista">{tituloDaLista}</h2>
              <p className="numero">{carregando ? "Procurando…" : `${total} ${total === 1 ? "animal encontrado" : "animais encontrados"}`}</p>
            </div>
          </div>

          <div className="barra-filtros">
            <div className="opcoes" role="group" aria-label="Espécie">
              {ESPECIES.map((opcao) => (
                <button key={opcao.chave || "todos"} type="button" className="opcao" aria-pressed={especie === opcao.chave}
                        onClick={() => filtrar({ especie: opcao.chave })}>
                  {opcao.chave && <IconeDaEspecie especie={opcao.chave} size={15} />}
                  {opcao.rotulo}
                </button>
              ))}
            </div>
            <span className="separador" aria-hidden="true" />
            <button type="button" className="opcao" aria-pressed={filhotes} onClick={() => filtrar({ filhotes: filhotes ? "" : "sim" })}>
              <Baby size={15} aria-hidden="true" />Filhotes
            </button>
            <select className="opcao" value={porte} aria-label="Porte" onChange={(e) => filtrar({ porte: e.target.value })}>
              <option value="">Qualquer porte</option>
              <option value="PEQUENO">Porte pequeno</option>
              <option value="MEDIO">Porte médio</option>
              <option value="GRANDE">Porte grande</option>
            </select>
            {(busca || especie || porte || filhotes) && (
              <button type="button" className="botao" data-tom="neutro" data-tamanho="pequeno"
                      onClick={() => { setTexto(""); router.replace("/", { scroll: false }); }}>
                Limpar filtros
              </button>
            )}
          </div>

          {erro ? (
            <p className="aviso" role="alert">{erro}</p>
          ) : carregando && animais.length === 0 ? (
            <div className="carregando"><LoaderCircle size={18} className="girando" aria-hidden="true" />Carregando</div>
          ) : animais.length === 0 ? (
            <div className="vazio">
              <SearchX size={26} aria-hidden="true" />
              <p>Nenhum animal com esses filtros agora. Tente tirar um filtro: chega bicho novo toda semana.</p>
            </div>
          ) : (
            <div className="grade">
              {animais.map((animal, indice) => <CartaoDeAnimal key={animal.id} animal={animal} prioridade={indice < 4} />)}
            </div>
          )}
        </section>
      </main>
      <Rodape />
    </>
  );
}
