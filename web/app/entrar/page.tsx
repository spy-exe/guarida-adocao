"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn, PawPrint } from "lucide-react";
import Campo from "@/components/Campo";
import Credito from "@/components/Credito";
import Topo from "@/components/Topo";
import { api, ErroDaApi, type Animal } from "@/lib/api";
import { gravarSessao, lerSessao } from "@/lib/sessao";

type Aba = "entrar" | "criar";

export default function Entrar() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("entrar");
  const [dados, setDados] = useState({ nome: "", email: "", senha: "", cidade: "", telefone: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [capa, setCapa] = useState<Animal | null>(null);

  useEffect(() => {
    if (lerSessao()) router.replace("/painel");
  }, [router]);

  useEffect(() => {
    api.catalogo({ status: "ADOTADO", tamanho: 12 })
      .then((pagina) => setCapa(pagina.itens.find((animal) => animal.foto) ?? null))
      .catch(() => undefined);
  }, []);

  function trocar(campo: keyof typeof dados, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function mudarDeAba(proxima: Aba) {
    setAba(proxima);
    setErro(null);
    setErros({});
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setErros({});
    setEnviando(true);

    try {
      if (aba === "criar") {
        await api.registrar({ nome: dados.nome, email: dados.email, senha: dados.senha, cidade: dados.cidade,
                              telefone: dados.telefone || undefined });
      }
      const token = await api.entrar({ email: dados.email, senha: dados.senha });
      const eu = await api.eu(token.token);
      gravarSessao({ token: token.token, nome: eu.nome, email: eu.email, cidade: eu.cidade, expiraEm: token.expiraEm });
      router.push("/painel");
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(Object.keys(falha.campos).length ? "Confira os campos marcados." : falha.message);
        setErros(falha.campos);
      } else {
        setErro("Algo saiu do previsto. Tente de novo.");
      }
      setEnviando(false);
    }
  }

  return (
    <>
      <Topo complemento="área do abrigo">
        <Link className="topo-link" href="/"><PawPrint size={16} aria-hidden="true" /><span>Catálogo</span></Link>
      </Topo>

      <main className="entrada">
        <div className="entrada-form">
          <h1>{aba === "entrar" ? "Bom te ver de volta." : "Cadastre o seu abrigo."}</h1>
          <p className="suave">
            {aba === "entrar"
              ? "O catálogo é aberto a todos. Cadastrar animal, responder pedido e fechar adoção fica aqui dentro."
              : "Leva um minuto. Depois é só cadastrar os animais que já estão com vocês."}
          </p>

          <div className="abas" role="tablist" aria-label="Acesso">
            <button className="aba" type="button" role="tab" aria-selected={aba === "entrar"} onClick={() => mudarDeAba("entrar")}>
              Entrar
            </button>
            <button className="aba" type="button" role="tab" aria-selected={aba === "criar"} onClick={() => mudarDeAba("criar")}>
              Criar conta
            </button>
          </div>

          <form className="formulario" onSubmit={enviar} noValidate>
            {aba === "criar" && (
              <>
                <Campo id="e-nome" rotulo="Nome do abrigo" erro={erros.nome}>
                  <input id="e-nome" value={dados.nome} onChange={(e) => trocar("nome", e.target.value)}
                         placeholder="Abrigo São Francisco" autoComplete="organization" />
                </Campo>
                <div className="dupla">
                  <Campo id="e-cidade" rotulo="Cidade" erro={erros.cidade}>
                    <input id="e-cidade" value={dados.cidade} onChange={(e) => trocar("cidade", e.target.value)}
                           autoComplete="address-level2" />
                  </Campo>
                  <Campo id="e-telefone" rotulo="Telefone" erro={erros.telefone}>
                    <input id="e-telefone" type="tel" value={dados.telefone} onChange={(e) => trocar("telefone", e.target.value)}
                           placeholder="(21) 99999-8888" autoComplete="tel" />
                  </Campo>
                </div>
              </>
            )}

            <Campo id="e-email" rotulo="E-mail" erro={erros.email}>
              <input id="e-email" type="email" value={dados.email} onChange={(e) => trocar("email", e.target.value)}
                     autoComplete="email" />
            </Campo>
            <Campo id="e-senha" rotulo="Senha" erro={erros.senha} ajuda={aba === "criar" ? "No mínimo 8 caracteres" : undefined}>
              <input id="e-senha" type="password" value={dados.senha} onChange={(e) => trocar("senha", e.target.value)}
                     autoComplete={aba === "criar" ? "new-password" : "current-password"} />
            </Campo>

            {erro && <p className="aviso" role="alert">{erro}</p>}

            <button className="botao" data-largura="cheia" type="submit" disabled={enviando}>
              {enviando ? <LoaderCircle size={16} className="girando" aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
              {enviando ? "Um instante" : aba === "criar" ? "Criar conta e entrar" : "Entrar"}
            </button>
          </form>

          {aba === "entrar" && (
            <p className="discreto" style={{ marginTop: "1.2rem" }}>
              Só quer conhecer o painel?{" "}
              <button type="button" className="link-simples"
                      onClick={() => setDados((atual) => ({ ...atual, email: "abrigo@guarida.app", senha: "demonstracao2026" }))}>
                Preencher com a conta de demonstração
              </button>
            </p>
          )}
        </div>

        <div className="entrada-foto">
          {capa?.foto && (
            <>
              <img src={capa.foto.url} alt={`${capa.nome}, já adotado`} />
              <Credito foto={capa.foto} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
