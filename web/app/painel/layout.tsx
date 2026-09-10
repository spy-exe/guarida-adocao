"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Marca from "@/components/Marca";
import { useSessao } from "@/lib/sessao";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { sessao, verificando, sair } = useSessao();
  const caminho = usePathname();

  if (verificando || !sessao) {
    return <p className="carregando">Conferindo a sessao</p>;
  }

  return (
    <>
      <header className="topo">
        <Link href="/painel">
          <Marca complemento={sessao.nome} />
        </Link>

        <nav className="topo-nav">
          <Link href="/painel" aria-current={caminho === "/painel" ? "page" : undefined}>
            Animais
          </Link>
          <Link href="/painel/novo" aria-current={caminho === "/painel/novo" ? "page" : undefined}>
            Cadastrar
          </Link>
          <Link href="/painel/candidaturas"
                aria-current={caminho === "/painel/candidaturas" ? "page" : undefined}>
            Pedidos
          </Link>
          <Link href="/">Catalogo</Link>
          <button className="botao" data-tom="vazado" type="button" onClick={sair}>
            Sair
          </button>
        </nav>
      </header>

      <main className="corpo">{children}</main>
    </>
  );
}
