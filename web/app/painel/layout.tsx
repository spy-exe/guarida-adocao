"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutGrid, LoaderCircle, LogOut, PawPrint, Plus } from "lucide-react";
import Topo from "@/components/Topo";
import { useSessao } from "@/lib/sessao";

const LINKS = [
  { href: "/painel", rotulo: "Acervo", Icone: LayoutGrid },
  { href: "/painel/candidaturas", rotulo: "Pedidos", Icone: Inbox },
  { href: "/painel/novo", rotulo: "Cadastrar", Icone: Plus }
];

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { sessao, verificando, sair } = useSessao();
  const caminho = usePathname();

  if (verificando || !sessao) {
    return (
      <div className="carregando">
        <LoaderCircle size={18} className="girando" aria-hidden="true" />Conferindo a sessão
      </div>
    );
  }

  return (
    <>
      <Topo complemento={sessao.nome}>
        {LINKS.map(({ href, rotulo, Icone }) => (
          <Link key={href} className="topo-link" href={href} aria-current={caminho === href ? "page" : undefined}>
            <Icone size={16} aria-hidden="true" /><span>{rotulo}</span>
          </Link>
        ))}
        <Link className="topo-link" href="/" title="Ver o catálogo público">
          <PawPrint size={16} aria-hidden="true" /><span>Catálogo</span>
        </Link>
        <button className="botao-icone" type="button" onClick={sair} aria-label="Sair" title="Sair">
          <LogOut size={17} aria-hidden="true" />
        </button>
      </Topo>

      <main className="corpo">{children}</main>
    </>
  );
}
