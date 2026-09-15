import { vi } from "vitest";
import type { Animal, Candidatura, Pagina, ResumoDoAbrigo } from "@/lib/api";

export function umAnimal(mudancas: Partial<Animal> = {}): Animal {
  return {
    id: 7,
    nome: "Estrela",
    especie: "CACHORRO",
    especieRotulo: "Cachorro",
    raca: "SRD",
    sexo: "FEMEA",
    sexoRotulo: "Fêmea",
    porte: "MEDIO",
    porteRotulo: "Médio",
    nascimentoEstimado: "2021-09-01",
    idadeEmMeses: 60,
    idadeRotulo: "5 anos",
    filhote: false,
    pesoEmGramas: 19000,
    castrado: true,
    vacinado: true,
    vermifugado: false,
    historia: "Chegou prenha e criou a ninhada inteira no abrigo.",
    observacoesDeSaude: "Toma condroitina.",
    status: "DISPONIVEL",
    statusRotulo: "Disponível para adoção",
    dataDeEntrada: "2025-10-10",
    temperamentos: [{ chave: "DOCIL", rotulo: "Dócil" }],
    abrigo: { id: 1, nome: "Abrigo São Francisco", cidade: "Niterói" },
    criadoEm: "2025-10-10T10:00:00",
    atualizadoEm: "2025-10-10T10:00:00",
    foto: { url: "/api/v1/animais/7/foto?v=abc", autor: "Sturm", licenca: "CC BY-SA 4.0",
            fonte: "https://commons.wikimedia.org/wiki/File:Estrela.jpg" },
    ...mudancas
  };
}

export function umPedido(mudancas: Partial<Candidatura> = {}): Candidatura {
  return {
    id: 31,
    animalId: 7,
    animalNome: "Estrela",
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    telefone: "21988887777",
    cidade: "Niterói",
    moradia: "APARTAMENTO",
    moradiaRotulo: "Apartamento",
    areaProtegida: true,
    temOutrosAnimais: false,
    mensagem: "Tenho tela em todas as janelas.",
    status: "RECEBIDA",
    statusRotulo: "Recebida",
    criadaEm: "2026-09-10T10:00:00",
    atualizadaEm: "2026-09-10T10:00:00",
    ...mudancas
  };
}

export function umResumo(mudancas: Partial<ResumoDoAbrigo> = {}): ResumoDoAbrigo {
  return { disponiveis: 21, emProcesso: 3, adotados: 4, indisponiveis: 0, total: 28, candidaturasEmAberto: 4,
           mediaDeDiasAteAdocao: 123.6, ...mudancas };
}

export function pagina<T>(itens: T[], total = itens.length): Pagina<T> {
  return { itens, pagina: 0, tamanho: 24, totalDeItens: total, totalDePaginas: 1 };
}

export function gravarSessaoDeTeste() {
  window.localStorage.setItem("guarida.sessao", JSON.stringify({
    token: "tok", nome: "Abrigo São Francisco", email: "abrigo@guarida.app", cidade: "Niterói",
    expiraEm: new Date(Date.now() + 3_600_000).toISOString()
  }));
}

/** Promessa que o teste resolve na hora que quiser, para ver o estado de carregamento. */
export function adiada<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (motivo: unknown) => void;
  const promessa = new Promise<T>((ok, falha) => { resolver = ok; rejeitar = falha; });
  return { promessa, resolver, rejeitar };
}

export const navegacao = {
  push: vi.fn(),
  replace: vi.fn(),
  parametros: new URLSearchParams(),
  caminho: "/",
  id: "7"
};
