"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormularioDeAnimal, {
  corpoDaRequisicao,
  dadosIniciais,
  type DadosDoFormulario
} from "@/components/FormularioDeAnimal";
import Retrato from "@/components/Retrato";
import { api, ErroDaApi, type Especie } from "@/lib/api";
import { lerSessao } from "@/lib/sessao";

export default function NovoAnimal() {
  const router = useRouter();
  const [dados, setDados] = useState<DadosDoFormulario>(dadosIniciais());
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const sessao = lerSessao();
    if (!sessao) return;

    setErro(null);
    setCampos({});
    setEnviando(true);

    try {
      const animal = await api.cadastrarAnimal(sessao.token, corpoDaRequisicao(dados, true));
      router.push(`/painel/${animal.id}`);
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(falha.message);
        setCampos(falha.campos);
      } else {
        setErro("Nao foi possivel cadastrar o animal.");
      }
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="cabecalho-secao">
        <div>
          <span className="etiqueta">Novo cadastro</span>
          <h2>Cadastrar animal</h2>
        </div>
        <Link className="botao" data-tom="vazado" href="/painel">
          Voltar
        </Link>
      </div>

      <div className="ficha">
        <form className="formulario" onSubmit={enviar} style={{ order: 2 }}>
          <FormularioDeAnimal dados={dados} aoMudar={setDados} campos={campos} mostrarEntrada />

          {erro && <p className="aviso">{erro}</p>}

          <button className="botao" type="submit" disabled={enviando}>
            {enviando ? "Cadastrando" : "Cadastrar animal"}
          </button>
        </form>

        <aside className="caixa-lateral" style={{ order: 1, position: "sticky", top: "5.5rem" }}>
          <h3>Como vai aparecer</h3>
          <div className="cartao-retrato" style={{ background: "var(--papel)", borderRadius: "4px" }}>
            <Retrato especie={dados.especie as Especie} />
          </div>
          <p>
            {dados.nome || "Sem nome ainda"}
            {dados.raca ? `, ${dados.raca}` : ""}
          </p>
          <p className="etiqueta">
            A ficha entra como disponivel, e a entrada no abrigo ja fica registrada na linha do tempo.
          </p>
        </aside>
      </div>
    </>
  );
}
