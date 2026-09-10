"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Marca from "@/components/Marca";
import PlaquinhaDeColeira from "@/components/PlaquinhaDeColeira";
import { api, ErroDaApi } from "@/lib/api";
import { gravarSessao, lerSessao } from "@/lib/sessao";

type Aba = "entrar" | "criar";

export default function Entrar() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (lerSessao()) router.replace("/painel");
  }, [router]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);

    try {
      if (aba === "criar") {
        await api.registrar({ nome, email, senha, cidade, telefone: telefone || undefined });
      }

      const token = await api.entrar({ email, senha });
      const eu = await api.eu(token.token);

      gravarSessao({
        token: token.token,
        nome: eu.nome,
        email: eu.email,
        cidade: eu.cidade,
        expiraEm: token.expiraEm
      });

      router.push("/painel");
    } catch (falha) {
      if (falha instanceof ErroDaApi) {
        setErro(falha.message);
        setCampos(falha.campos);
      } else {
        setErro("Algo saiu do previsto. Tente de novo.");
      }
      setEnviando(false);
    }
  }

  return (
    <>
      <header className="topo">
        <Link href="/">
          <Marca complemento="abrigo e adocao" />
        </Link>
        <nav className="topo-nav">
          <Link href="/">Catalogo</Link>
          <a href="/swagger-ui.html">API</a>
        </nav>
      </header>

      <main className="corpo">
        <div className="vitrine">
          <div className="vitrine-texto">
            <span className="etiqueta entra">Area do abrigo</span>
            <h1 className="entra" style={{ animationDelay: "70ms" }}>
              Quem cuida, cadastra.
            </h1>
            <p className="entra" style={{ animationDelay: "140ms" }}>
              O catalogo e aberto para quem procura. Cadastrar, alterar e excluir animal e coisa do
              abrigo, e por isso pede entrada.
            </p>

            <div className="vitrine-palco entra" style={{ animationDelay: "210ms", marginTop: "2rem" }}>
              <PlaquinhaDeColeira nome="Guarida" linhaDeBaixo="abrigo e adocao" altura={260} />
              <p className="dica-arraste">Arraste a plaquinha</p>
            </div>
          </div>

          <div>
            <div className="filtros" role="tablist">
              <button
                className="filtro"
                type="button"
                role="tab"
                aria-selected={aba === "entrar"}
                data-ativo={aba === "entrar" ? "sim" : "nao"}
                onClick={() => setAba("entrar")}
              >
                Entrar
              </button>
              <button
                className="filtro"
                type="button"
                role="tab"
                aria-selected={aba === "criar"}
                data-ativo={aba === "criar" ? "sim" : "nao"}
                onClick={() => setAba("criar")}
              >
                Cadastrar abrigo
              </button>
            </div>

            <form className="formulario" onSubmit={enviar}>
              {aba === "criar" && (
                <>
                  <label className="campo">
                    <span>Nome do abrigo</span>
                    <input value={nome} onChange={(e) => setNome(e.target.value)}
                           placeholder="Abrigo Sao Francisco" required />
                    {campos.nome && <em className="campo-erro">{campos.nome}</em>}
                  </label>

                  <div className="dupla">
                    <label className="campo">
                      <span>Cidade</span>
                      <input value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                      {campos.cidade && <em className="campo-erro">{campos.cidade}</em>}
                    </label>
                    <label className="campo">
                      <span>Telefone</span>
                      <input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                             placeholder="21999998888" />
                      {campos.telefone && <em className="campo-erro">{campos.telefone}</em>}
                    </label>
                  </div>
                </>
              )}

              <label className="campo">
                <span>E-mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       autoComplete="email" required />
                {campos.email && <em className="campo-erro">{campos.email}</em>}
              </label>

              <label className="campo">
                <span>Senha</span>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                       placeholder={aba === "criar" ? "no minimo 8 caracteres" : ""}
                       autoComplete={aba === "criar" ? "new-password" : "current-password"} required />
                {campos.senha && <em className="campo-erro">{campos.senha}</em>}
              </label>

              {erro && <p className="aviso">{erro}</p>}

              <button className="botao" data-largura="cheia" type="submit" disabled={enviando}>
                {enviando ? "Um instante" : aba === "criar" ? "Cadastrar e entrar" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
