"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import FormularioDeAnimal, { corpoDaRequisicao, dadosIniciais, type DadosDoFormulario } from "@/components/FormularioDeAnimal";
import Retrato from "@/components/Retrato";
import { api, ErroDaApi } from "@/lib/api";
import { lerSessao } from "@/lib/sessao";

export default function NovoAnimal() {
  const router = useRouter();
  const [dados, setDados] = useState<DadosDoFormulario>(() => dadosIniciais());
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const sessao = lerSessao();
    if (!sessao) return;

    setErro(null);
    setErros({});
    setEnviando(true);
    try {
      const animal = await api.cadastrarAnimal(sessao.token, corpoDaRequisicao(dados, true));
      // a foto só pode subir depois que o animal existe, então a ficha abre já no envio de foto
      router.push(`/painel/${animal.id}?novo=sim`);
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(Object.keys(falha.campos).length ? "Confira os campos marcados." : falha.message);
        setErros(falha.campos);
      } else {
        setErro("O cadastro não foi salvo. Tente de novo.");
      }
      setEnviando(false);
    }
  }

  return (
    <>
      <nav className="migalha" aria-label="Você está em">
        <Link href="/painel"><ChevronLeft size={15} aria-hidden="true" style={{ verticalAlign: "-3px" }} />Acervo</Link>
        <span>/</span>
        <span>Novo animal</span>
      </nav>

      <div className="ficha">
        <form className="formulario painel-caixa" onSubmit={enviar} noValidate>
          <h1 style={{ fontSize: "2rem" }}>Cadastrar animal</h1>
          <FormularioDeAnimal dados={dados} aoMudar={setDados} erros={erros} mostrarEntrada />
          {erro && <p className="aviso" role="alert">{erro}</p>}
          <div className="acoes">
            <button className="botao" type="submit" disabled={enviando}>
              {enviando && <LoaderCircle size={16} className="girando" aria-hidden="true" />}
              {enviando ? "Salvando" : "Salvar e seguir para a foto"}
            </button>
            <Link className="botao" data-tom="neutro" href="/painel">Cancelar</Link>
          </div>
        </form>

        <aside className="lateral">
          <section className="painel-caixa">
            <h3>Como entra no catálogo</h3>
            <div className="envio-previa" style={{ margin: "0.8rem 0" }}>
              <div className="retrato" style={{ background: "var(--musgo-claro)", color: "var(--musgo)" }}>
                <Retrato especie={dados.especie} />
              </div>
            </div>
            <p><strong>{dados.nome.trim() || "Sem nome ainda"}</strong>{dados.raca.trim() ? `, ${dados.raca.trim()}` : ""}</p>
            <p className="discreto" style={{ marginTop: "0.5rem" }}>
              A ficha entra como disponível e a chegada ao abrigo já fica na linha do tempo. Na próxima tela dá para mandar a foto.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
