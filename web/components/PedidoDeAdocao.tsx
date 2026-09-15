"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Campo from "@/components/Campo";
import { api, ErroDaApi, type Animal } from "@/lib/api";

export default function PedidoDeAdocao({ animal }: { animal: Animal }) {
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "", cidade: "", moradia: "CASA",
                                       areaProtegida: true, temOutrosAnimais: false, mensagem: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<number | null>(null);

  function trocar(campo: string, valor: string | boolean) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setErros({});
    setEnviando(true);
    try {
      const recebida = await api.candidatar(animal.id, { ...dados, mensagem: dados.mensagem.trim() || undefined });
      setProtocolo(recebida.id);
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(Object.keys(falha.campos).length ? "Confira os campos marcados." : falha.message);
        setErros(falha.campos);
      } else {
        setErro("O pedido não foi enviado. Tente de novo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (animal.status !== "DISPONIVEL") {
    return (
      <section className="painel-caixa">
        <h3>{animal.nome} não está recebendo pedidos</h3>
        <p className="suave">No momento a situação é “{animal.statusRotulo.toLowerCase()}”.</p>
        <Link className="botao" data-tom="neutro" href="/" style={{ marginTop: "1rem" }}>Ver quem está esperando</Link>
      </section>
    );
  }

  if (protocolo) {
    return (
      <section className="painel-caixa">
        <p className="aviso" data-tom="ok" role="status">
          <CircleCheck size={17} aria-hidden="true" />
          <span>Pedido enviado. O abrigo responde pelo e-mail que você deixou. Seu protocolo é o número {protocolo}.</span>
        </p>
      </section>
    );
  }

  return (
    <section className="painel-caixa" aria-labelledby="titulo-pedido">
      <h3 id="titulo-pedido">Quero adotar {animal.nome}</h3>
      <p className="discreto" style={{ marginBottom: "1rem" }}>
        O abrigo lê cada pedido antes de responder. Contar sobre a casa e a rotina ajuda.
      </p>
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo id="p-nome" rotulo="Seu nome" erro={erros.nome}>
          <input id="p-nome" value={dados.nome} autoComplete="name" onChange={(e) => trocar("nome", e.target.value)} />
        </Campo>
        <div className="dupla">
          <Campo id="p-email" rotulo="E-mail" erro={erros.email}>
            <input id="p-email" type="email" value={dados.email} autoComplete="email" onChange={(e) => trocar("email", e.target.value)} />
          </Campo>
          <Campo id="p-telefone" rotulo="Telefone" erro={erros.telefone}>
            <input id="p-telefone" type="tel" value={dados.telefone} autoComplete="tel" placeholder="(21) 99999-8888"
                   onChange={(e) => trocar("telefone", e.target.value)} />
          </Campo>
        </div>
        <div className="dupla">
          <Campo id="p-cidade" rotulo="Cidade" erro={erros.cidade}>
            <input id="p-cidade" value={dados.cidade} autoComplete="address-level2" onChange={(e) => trocar("cidade", e.target.value)} />
          </Campo>
          <Campo id="p-moradia" rotulo="Mora em">
            <select id="p-moradia" value={dados.moradia} onChange={(e) => trocar("moradia", e.target.value)}>
              <option value="CASA">Casa</option>
              <option value="APARTAMENTO">Apartamento</option>
              <option value="SITIO">Sítio ou chácara</option>
            </select>
          </Campo>
        </div>
        <div className="opcoes">
          <button type="button" className="opcao" aria-pressed={dados.areaProtegida} onClick={() => trocar("areaProtegida", !dados.areaProtegida)}>
            Tem tela, muro ou cerca
          </button>
          <button type="button" className="opcao" aria-pressed={dados.temOutrosAnimais} onClick={() => trocar("temOutrosAnimais", !dados.temOutrosAnimais)}>
            Já tenho outros animais
          </button>
        </div>
        <Campo id="p-mensagem" rotulo="Sobre a sua rotina" erro={erros.mensagem}>
          <textarea id="p-mensagem" value={dados.mensagem} maxLength={800} onChange={(e) => trocar("mensagem", e.target.value)}
                    placeholder="Quem mora com você, quanto tempo o animal ficaria sozinho" />
        </Campo>
        {erro && <p className="aviso" role="alert">{erro}</p>}
        <button className="botao" type="submit" data-largura="cheia" disabled={enviando}>
          {enviando && <LoaderCircle size={16} className="girando" aria-hidden="true" />}
          {enviando ? "Enviando" : "Enviar pedido"}
        </button>
      </form>
    </section>
  );
}
