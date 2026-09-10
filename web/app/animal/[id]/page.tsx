"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LinhaFicha from "@/components/LinhaFicha";
import Marca from "@/components/Marca";
import PlaquinhaDeColeira from "@/components/PlaquinhaDeColeira";
import Retrato from "@/components/Retrato";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import { api, ErroDaApi, type Animal, type Evento } from "@/lib/api";
import { data, matizDoAnimal, peso } from "@/lib/formato";

export default function FichaDoAnimal() {
  const parametros = useParams<{ id: string }>();
  const id = parametros.id;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [moradia, setMoradia] = useState("CASA");
  const [areaProtegida, setAreaProtegida] = useState(true);
  const [temOutrosAnimais, setTemOutrosAnimais] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [ficha, linha] = await Promise.all([api.animal(id), api.eventos(id)]);
      setAnimal(ficha);
      setEventos(linha);
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "Nao foi possivel carregar a ficha.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function candidatar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);

    try {
      const recebida = await api.candidatar(id, {
        nome,
        email,
        telefone,
        cidade,
        moradia,
        areaProtegida,
        temOutrosAnimais,
        mensagem: mensagem || undefined
      });
      setProtocolo(recebida.id);
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(falha.message);
        setCampos(falha.campos);
      } else {
        setErro("Nao foi possivel enviar o pedido.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return <p className="carregando">Carregando</p>;
  }

  if (!animal) {
    return (
      <main className="corpo">
        <div className="vazio">
          <p>{erro ?? "Animal nao encontrado."}</p>
          <Link className="botao" href="/">
            Voltar para o catalogo
          </Link>
        </div>
      </main>
    );
  }

  const disponivel = animal.status === "DISPONIVEL";

  return (
    <>
      <header className="topo">
        <Link href="/">
          <Marca complemento="abrigo e adocao" />
        </Link>
        <nav className="topo-nav">
          <Link href="/">Catalogo</Link>
          <Link className="botao" data-tom="vazado" href="/entrar">
            Entrar como abrigo
          </Link>
        </nav>
      </header>

      <main className="corpo">
        <div className="cabecalho-secao">
          <div>
            <span className="etiqueta">
              <Link href="/">Catalogo</Link> / ficha {animal.id}
            </span>
            <h2>{animal.nome}</h2>
          </div>
          <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} />
        </div>

        <div className="ficha">
          <article className="caderneta">
            <header className="caderneta-capa">
              <span className="etiqueta">Caderneta do animal</span>
              <h2>{animal.nome}</h2>
            </header>

            <div className="caderneta-retrato" style={{ background: matizDoAnimal(animal.id) }}>
              <Retrato especie={animal.especie} />
            </div>

            <div className="caderneta-corpo">
              <LinhaFicha rotulo="Ficha" valor={String(animal.id)} />
              <LinhaFicha rotulo="Especie" valor={animal.especieRotulo} />
              {animal.raca && <LinhaFicha rotulo="Raca" valor={animal.raca} />}
              <LinhaFicha rotulo="Sexo" valor={animal.sexoRotulo} />
              <LinhaFicha rotulo="Porte" valor={animal.porteRotulo} />
              <LinhaFicha rotulo="Idade" valor={animal.idadeRotulo} />
              <LinhaFicha rotulo="Peso" valor={peso(animal.pesoEmGramas)} />
              <LinhaFicha rotulo="Entrada" valor={data(animal.dataDeEntrada)} />
              <LinhaFicha rotulo="Abrigo" valor={animal.abrigo.nome} />
              <LinhaFicha rotulo="Cidade" valor={animal.abrigo.cidade} />
            </div>

            <div className="caderneta-selos">
              <span className="carimbo" data-feito={animal.castrado ? "sim" : "nao"}>
                {animal.castrado ? "castrado" : "nao castrado"}
              </span>
              <span className="carimbo" data-feito={animal.vacinado ? "sim" : "nao"}>
                {animal.vacinado ? "vacinado" : "sem vacina"}
              </span>
              <span className="carimbo" data-feito={animal.vermifugado ? "sim" : "nao"}>
                {animal.vermifugado ? "vermifugado" : "sem vermifugo"}
              </span>
            </div>

            {eventos.length > 0 && (
              <div className="linha-do-tempo">
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
            )}
          </article>

          <div style={{ display: "grid", gap: "1.4rem" }}>
            {animal.historia && (
              <section className="caixa-lateral">
                <h3>Historia</h3>
                <p>{animal.historia}</p>
              </section>
            )}

            {animal.temperamentos.length > 0 && (
              <section className="caixa-lateral">
                <h3>Como {animal.nome} e</h3>
                <div className="cartao-tracos">
                  {animal.temperamentos.map((traco) => (
                    <span className="traco" key={traco.chave}>
                      {traco.rotulo}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {animal.observacoesDeSaude && (
              <section className="caixa-lateral">
                <h3>Saude</h3>
                <p>{animal.observacoesDeSaude}</p>
              </section>
            )}

            <section className="caixa-lateral" style={{ padding: 0, overflow: "hidden" }}>
              <PlaquinhaDeColeira
                nome={animal.nome}
                linhaDeBaixo={animal.abrigo.cidade}
                identificador={`FICHA ${animal.id}`}
                altura={300}
              />
              <p className="dica-arraste">Arraste a plaquinha</p>
            </section>

            {protocolo ? (
              <section className="caixa-lateral">
                <h3>Pedido enviado</h3>
                <p className="aviso" data-tom="ok">
                  Recebemos seu pedido para {animal.nome}, protocolo {protocolo}. O abrigo entra em
                  contato pelo e-mail que voce deixou.
                </p>
                <Link className="botao" data-tom="vazado" href="/">
                  Ver outros animais
                </Link>
              </section>
            ) : disponivel ? (
              <section className="caixa-lateral">
                <h3>Quero adotar {animal.nome}</h3>
                <p>
                  O abrigo le cada pedido antes de responder. Quanto mais voce contar sobre a casa e a
                  rotina, mais rapido a conversa anda.
                </p>

                <form className="formulario" onSubmit={candidatar}>
                  <div className="dupla">
                    <label className="campo">
                      <span>Seu nome</span>
                      <input value={nome} onChange={(e) => setNome(e.target.value)} required />
                      {campos.nome && <em className="campo-erro">{campos.nome}</em>}
                    </label>
                    <label className="campo">
                      <span>E-mail</span>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                             required />
                      {campos.email && <em className="campo-erro">{campos.email}</em>}
                    </label>
                  </div>

                  <div className="dupla">
                    <label className="campo">
                      <span>Telefone com DDD</span>
                      <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                             placeholder="21999998888" required />
                      {campos.telefone && <em className="campo-erro">{campos.telefone}</em>}
                    </label>
                    <label className="campo">
                      <span>Cidade</span>
                      <input value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                      {campos.cidade && <em className="campo-erro">{campos.cidade}</em>}
                    </label>
                  </div>

                  <label className="campo">
                    <span>Onde voce mora</span>
                    <select value={moradia} onChange={(e) => setMoradia(e.target.value)}>
                      <option value="CASA">Casa</option>
                      <option value="APARTAMENTO">Apartamento</option>
                      <option value="SITIO">Sitio ou chacara</option>
                    </select>
                  </label>

                  <div className="caixas">
                    <label className="caixa" data-marcada={areaProtegida ? "sim" : "nao"}>
                      <input type="checkbox" checked={areaProtegida}
                             onChange={(e) => setAreaProtegida(e.target.checked)} />
                      Tem tela, muro ou cerca
                    </label>
                    <label className="caixa" data-marcada={temOutrosAnimais ? "sim" : "nao"}>
                      <input type="checkbox" checked={temOutrosAnimais}
                             onChange={(e) => setTemOutrosAnimais(e.target.checked)} />
                      Ja tenho outros animais
                    </label>
                  </div>

                  <label className="campo">
                    <span>Conte um pouco da sua rotina</span>
                    <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)}
                              placeholder="Quem mora na casa, quanto tempo o animal fica sozinho, se ja teve bicho antes" />
                  </label>

                  {erro && <p className="aviso">{erro}</p>}

                  <button className="botao" type="submit" disabled={enviando}>
                    {enviando ? "Enviando" : "Enviar pedido"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="caixa-lateral">
                <h3>Nao esta disponivel</h3>
                <p>
                  {animal.nome} esta como {animal.statusRotulo.toLowerCase()} no momento, entao o abrigo
                  nao esta recebendo pedidos por aqui.
                </p>
                <Link className="botao" data-tom="vazado" href="/">
                  Ver quem esta esperando
                </Link>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
