import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navegacao } from "../fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => navegacao }));

import { gravarSessao, lerSessao, limparSessao, useSessao, type Sessao } from "@/lib/sessao";

const valida: Sessao = { token: "t", nome: "Abrigo", email: "a@b.c", cidade: "Niterói",
                         expiraEm: new Date(Date.now() + 60_000).toISOString() };

describe("sessão do abrigo", () => {
  beforeEach(() => {
    navegacao.replace.mockReset();
  });

  it("grava, lê e limpa", () => {
    expect(lerSessao()).toBeNull();
    gravarSessao(valida);
    expect(lerSessao()).toEqual(valida);
    limparSessao();
    expect(lerSessao()).toBeNull();
  });

  it("descarta sessão vencida", () => {
    gravarSessao({ ...valida, expiraEm: "2000-01-01T00:00:00Z" });
    expect(lerSessao()).toBeNull();
    expect(window.localStorage.getItem("guarida.sessao")).toBeNull();
  });

  it("descarta conteúdo que não é JSON", () => {
    window.localStorage.setItem("guarida.sessao", "{quebrado");
    expect(lerSessao()).toBeNull();
    expect(window.localStorage.getItem("guarida.sessao")).toBeNull();
  });

  it("no servidor não há sessão", () => {
    const janela = globalThis.window;
    vi.stubGlobal("window", undefined);
    expect(lerSessao()).toBeNull();
    vi.stubGlobal("window", janela);
    vi.unstubAllGlobals();
  });

  it("manda para a entrada quem não tem sessão", () => {
    const { result } = renderHook(() => useSessao());
    expect(navegacao.replace).toHaveBeenCalledWith("/entrar");
    expect(result.current.verificando).toBe(true);
  });

  it("libera quem tem sessão e sair limpa e volta ao catálogo", () => {
    gravarSessao(valida);
    const { result } = renderHook(() => useSessao());
    expect(result.current.verificando).toBe(false);
    expect(result.current.sessao?.nome).toBe("Abrigo");

    act(() => result.current.sair());
    expect(lerSessao()).toBeNull();
    expect(navegacao.replace).toHaveBeenCalledWith("/");
  });
});
