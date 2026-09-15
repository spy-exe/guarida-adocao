"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarDays, ChevronLeft, Hand, House, LoaderCircle, MapPin, Mars, PawPrint, Pill, Ruler,
  Scissors, Syringe, Venus, Weight
} from "lucide-react";
import Credito from "@/components/Credito";
import FotoDoAnimal from "@/components/FotoDoAnimal";
import IconeDaEspecie from "@/components/IconeDaEspecie";
import PedidoDeAdocao from "@/components/PedidoDeAdocao";
import PlaquinhaDeColeira from "@/components/PlaquinhaDeColeira";
import Rodape from "@/components/Rodape";
import SeloDeSituacao from "@/components/SeloDeSituacao";
import Topo from "@/components/Topo";
import { api, ErroDaApi, type Animal, type Evento } from "@/lib/api";
import { dataPorExtenso, peso, tempoNoAbrigo } from "@/lib/formato";

export default function FichaDoAnimal() {
  const { id } = useParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.animal(id), api.eventos(id)])
      .then(([ficha, linha]) => { setAnimal(ficha); setEventos(linha); })
      .catch((falha) => setErroDeCarga(falha instanceof ErroDaApi ? falha.message : "A ficha não carregou."))
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <>
      <Topo complemento="adoção de animais">
        <Link className="topo-link" href="/"><PawPrint size={16} aria-hidden="true" /><span>Catálogo</span></Link>
      </Topo>

      <main className="corpo">
        {carregando ? (
          <div className="carregando"><LoaderCircle size={18} className="girando" aria-hidden="true" />Carregando a ficha</div>
        ) : !animal ? (
          <div className="vazio">
            <p>{erroDeCarga ?? "Animal não encontrado."}</p>
            <Link className="botao" href="/">Voltar ao catálogo</Link>
          </div>
        ) : (
          <Ficha animal={animal} eventos={eventos} />
        )}
      </main>
      <Rodape />
    </>
  );
}

function Ficha({ animal, eventos }: { animal: Animal; eventos: Evento[] }) {
  const Sexo = animal.sexo === "FEMEA" ? Venus : Mars;

  return (
    <>
      <nav className="migalha" aria-label="Você está em">
        <Link href="/"><ChevronLeft size={15} aria-hidden="true" style={{ verticalAlign: "-3px" }} />Catálogo</Link>
        <span>/</span>
        <span>{animal.nome}</span>
      </nav>

      <div className="ficha">
        <div>
          <div className="ficha-foto"><FotoDoAnimal animal={animal} prioridade tamanhos="(max-width: 960px) 100vw, 680px" /></div>
          <Credito foto={animal.foto} />

          <div className="ficha-titulo">
            <h1>{animal.nome}</h1>
            <SeloDeSituacao status={animal.status} rotulo={animal.statusRotulo} />
          </div>
          <p className="suave" style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "1.4rem" }}>
            <MapPin size={15} aria-hidden="true" />{animal.abrigo.nome}, {animal.abrigo.cidade}
          </p>

          {animal.historia && <p className="historia" style={{ margin: "1.3rem 0 1.6rem" }}>{animal.historia}</p>}

          <section className="painel-caixa">
            <h3>Ficha</h3>
            <dl className="dados">
              <div className="dado"><dt><IconeDaEspecie especie={animal.especie} size={14} />Espécie</dt><dd>{animal.especieRotulo}</dd></div>
              <div className="dado"><dt><PawPrint size={14} aria-hidden="true" />Raça</dt><dd>{animal.raca ?? "Sem raça definida"}</dd></div>
              <div className="dado"><dt><Sexo size={14} aria-hidden="true" />Sexo</dt><dd>{animal.sexoRotulo}</dd></div>
              <div className="dado"><dt><CalendarDays size={14} aria-hidden="true" />Idade</dt><dd>{animal.idadeRotulo}</dd></div>
              <div className="dado"><dt><Ruler size={14} aria-hidden="true" />Porte</dt><dd>{animal.porteRotulo}</dd></div>
              <div className="dado"><dt><Weight size={14} aria-hidden="true" />Peso</dt><dd className="numero">{peso(animal.pesoEmGramas)}</dd></div>
              <div className="dado"><dt><House size={14} aria-hidden="true" />No abrigo</dt><dd>{tempoNoAbrigo(animal.dataDeEntrada)}</dd></div>
            </dl>

            <div className="cuidados" style={{ marginTop: "1.2rem" }}>
              <span className="cuidado" data-feito={animal.vacinado ? "sim" : undefined}><Syringe size={14} aria-hidden="true" />{animal.vacinado ? "Vacinado" : "Vacina pendente"}</span>
              <span className="cuidado" data-feito={animal.castrado ? "sim" : undefined}><Scissors size={14} aria-hidden="true" />{animal.castrado ? "Castrado" : "Não castrado"}</span>
              <span className="cuidado" data-feito={animal.vermifugado ? "sim" : undefined}><Pill size={14} aria-hidden="true" />{animal.vermifugado ? "Vermifugado" : "Vermífugo pendente"}</span>
            </div>
          </section>

          {animal.temperamentos.length > 0 && (
            <section className="painel-caixa">
              <h3>Jeito de ser</h3>
              <div className="tracos">
                {animal.temperamentos.map((traco) => <span className="traco" key={traco.chave}>{traco.rotulo}</span>)}
              </div>
            </section>
          )}

          {animal.observacoesDeSaude && (
            <section className="painel-caixa"><h3>Saúde</h3><p className="suave">{animal.observacoesDeSaude}</p></section>
          )}

          {eventos.length > 0 && (
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
          )}
        </div>

        <aside className="lateral">
          <PedidoDeAdocao animal={animal} />
          <div className="plaquinha-caixa">
            <PlaquinhaDeColeira nome={animal.nome} linhaDeBaixo={animal.abrigo.cidade} identificador={`FICHA ${animal.id}`} altura={230} />
            <p className="plaquinha-dica"><Hand size={14} aria-hidden="true" />Arraste a plaquinha</p>
          </div>
        </aside>
      </div>
    </>
  );
}
