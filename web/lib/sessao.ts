"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CHAVE = "guarida.sessao";

export interface Sessao {
  token: string;
  nome: string;
  email: string;
  cidade: string;
  expiraEm: string;
}

/**
 * O token fica no localStorage porque a API e stateless e o painel roda inteiro
 * no navegador. Em um sistema com dado sensivel de verdade o lugar dele seria
 * um cookie HttpOnly, fora do alcance de qualquer script.
 */
export function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;

  const bruto = window.localStorage.getItem(CHAVE);
  if (!bruto) return null;

  try {
    const sessao = JSON.parse(bruto) as Sessao;
    if (new Date(sessao.expiraEm).getTime() < Date.now()) {
      window.localStorage.removeItem(CHAVE);
      return null;
    }
    return sessao;
  } catch {
    window.localStorage.removeItem(CHAVE);
    return null;
  }
}

export function gravarSessao(sessao: Sessao) {
  window.localStorage.setItem(CHAVE, JSON.stringify(sessao));
}

export function limparSessao() {
  window.localStorage.removeItem(CHAVE);
}

export function useSessao() {
  const router = useRouter();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const atual = lerSessao();
    if (!atual) {
      router.replace("/entrar");
      return;
    }
    setSessao(atual);
    setVerificando(false);
  }, [router]);

  function sair() {
    limparSessao();
    router.replace("/");
  }

  return { sessao, verificando, sair };
}
