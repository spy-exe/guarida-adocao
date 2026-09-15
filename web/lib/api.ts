export type Especie = "CACHORRO" | "GATO" | "COELHO" | "PASSARO" | "OUTRO";
export type Sexo = "MACHO" | "FEMEA";
export type Porte = "PEQUENO" | "MEDIO" | "GRANDE";
export type StatusAnimal = "DISPONIVEL" | "EM_PROCESSO" | "ADOTADO" | "INDISPONIVEL";
export type TipoDeMoradia = "CASA" | "APARTAMENTO" | "SITIO";
export type StatusDaCandidatura = "RECEBIDA" | "EM_ANALISE" | "APROVADA" | "RECUSADA" | "CANCELADA";

export interface Traco {
  chave: string;
  rotulo: string;
}

export interface Foto {
  url: string;
  autor?: string;
  licenca?: string;
  fonte?: string;
}

export interface Animal {
  id: number;
  nome: string;
  especie: Especie;
  especieRotulo: string;
  raca?: string;
  sexo: Sexo;
  sexoRotulo: string;
  porte: Porte;
  porteRotulo: string;
  nascimentoEstimado: string;
  idadeEmMeses: number;
  idadeRotulo: string;
  filhote: boolean;
  pesoEmGramas: number;
  castrado: boolean;
  vacinado: boolean;
  vermifugado: boolean;
  historia?: string;
  observacoesDeSaude?: string;
  status: StatusAnimal;
  statusRotulo: string;
  dataDeEntrada: string;
  temperamentos: Traco[];
  abrigo: { id: number; nome: string; cidade: string };
  criadoEm: string;
  atualizadoEm: string;
  foto?: Foto;
}

export interface Evento {
  tipo: string;
  tipoRotulo: string;
  descricao: string;
  acontecido: string;
}

export interface Candidatura {
  id: number;
  animalId: number;
  animalNome: string;
  nome: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  moradia?: TipoDeMoradia;
  moradiaRotulo?: string;
  areaProtegida: boolean;
  temOutrosAnimais: boolean;
  mensagem?: string;
  status: StatusDaCandidatura;
  statusRotulo: string;
  motivoDaRecusa?: string;
  criadaEm: string;
  atualizadaEm: string;
}

export interface ResumoDoAbrigo {
  disponiveis: number;
  emProcesso: number;
  adotados: number;
  indisponiveis: number;
  total: number;
  candidaturasEmAberto: number;
  mediaDeDiasAteAdocao: number;
}

export interface FatiaDeEspecie {
  especie: Especie;
  rotulo: string;
  quantidade: number;
}

export interface AdocoesNoMes {
  mes: string;
  quantidade: number;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  totalDeItens: number;
  totalDePaginas: number;
}

export interface FiltroDeAnimais {
  especie?: string;
  porte?: string;
  sexo?: string;
  status?: string;
  temperamento?: string;
  apenasFilhotes?: boolean;
  cidade?: string;
  busca?: string;
  tamanho?: number;
  pagina?: number;
}

/** Erro no formato RFC 7807 devolvido pela API, com o mapa de campos reprovados. */
export class ErroDaApi extends Error {
  readonly status: number;
  readonly campos: Record<string, string>;

  constructor(mensagem: string, status: number, campos: Record<string, string> = {}) {
    super(mensagem);
    this.name = "ErroDaApi";
    this.status = status;
    this.campos = campos;
  }
}

interface Opcoes {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  corpo?: unknown;
  formulario?: FormData;
  token?: string;
}

async function requisicao<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {};

  // FormData leva o proprio Content-Type com o boundary; escrever na mao quebraria o envio
  if (opcoes.corpo !== undefined && !opcoes.formulario) {
    cabecalhos["Content-Type"] = "application/json";
  }
  if (opcoes.token) {
    cabecalhos.Authorization = `Bearer ${opcoes.token}`;
  }

  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      method: opcoes.metodo ?? "GET",
      headers: cabecalhos,
      body: opcoes.formulario ?? (opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo))
    });
  } catch {
    throw new ErroDaApi("Não foi possível falar com a API. Confira sua conexão e tente de novo.", 0);
  }

  const texto = await resposta.text();
  let dados: any = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    // resposta que nao e JSON, como a pagina de erro de um proxy no meio do caminho
    dados = null;
  }

  if (!resposta.ok) {
    const detalhe: string = dados?.detail ?? dados?.title ?? `Erro ${resposta.status}`;
    throw new ErroDaApi(detalhe, resposta.status, dados?.campos ?? {});
  }

  return dados as T;
}

function parametros(filtros: FiltroDeAnimais): URLSearchParams {
  const busca = new URLSearchParams();
  if (filtros.especie) busca.set("especie", filtros.especie);
  if (filtros.porte) busca.set("porte", filtros.porte);
  if (filtros.sexo) busca.set("sexo", filtros.sexo);
  if (filtros.status) busca.set("status", filtros.status);
  if (filtros.temperamento) busca.set("temperamento", filtros.temperamento);
  if (filtros.apenasFilhotes) busca.set("apenasFilhotes", "true");
  if (filtros.cidade) busca.set("cidade", filtros.cidade);
  if (filtros.busca) busca.set("busca", filtros.busca);
  busca.set("size", String(filtros.tamanho ?? 24));
  busca.set("page", String(filtros.pagina ?? 0));
  return busca;
}

export const api = {
  registrar(corpo: { nome: string; email: string; senha: string; cidade: string; telefone?: string }) {
    return requisicao<{ id: number; nome: string }>("/api/v1/autenticacao/registro", {
      metodo: "POST",
      corpo
    });
  },

  entrar(corpo: { email: string; senha: string }) {
    return requisicao<{ token: string; tipo: string; expiraEm: string }>("/api/v1/autenticacao/login", {
      metodo: "POST",
      corpo
    });
  },

  eu(token: string) {
    return requisicao<{ id: number; nome: string; email: string; cidade: string }>(
      "/api/v1/autenticacao/eu", { token });
  },

  catalogo(filtros: FiltroDeAnimais = {}) {
    return requisicao<Pagina<Animal>>(`/api/v1/animais?${parametros(filtros)}`);
  },

  animal(id: number | string) {
    return requisicao<Animal>(`/api/v1/animais/${id}`);
  },

  eventos(id: number | string) {
    return requisicao<Evento[]>(`/api/v1/animais/${id}/eventos`);
  },

  candidatar(id: number | string, corpo: unknown) {
    return requisicao<Candidatura>(`/api/v1/animais/${id}/candidaturas`, { metodo: "POST", corpo });
  },

  cadastrarAnimal(token: string, corpo: unknown) {
    return requisicao<Animal>("/api/v1/animais", { metodo: "POST", corpo, token });
  },

  atualizarAnimal(token: string, id: number | string, corpo: unknown) {
    return requisicao<Animal>(`/api/v1/animais/${id}`, { metodo: "PUT", corpo, token });
  },

  excluirAnimal(token: string, id: number | string) {
    return requisicao<void>(`/api/v1/animais/${id}`, { metodo: "DELETE", token });
  },

  suspender(token: string, id: number | string) {
    return requisicao<Animal>(`/api/v1/animais/${id}/suspensao`, { metodo: "POST", token });
  },

  reativar(token: string, id: number | string) {
    return requisicao<Animal>(`/api/v1/animais/${id}/reativacao`, { metodo: "POST", token });
  },

  registrarEvento(token: string, id: number | string, corpo: unknown) {
    return requisicao<Evento>(`/api/v1/animais/${id}/eventos`, { metodo: "POST", corpo, token });
  },

  animaisDoAbrigo(token: string, filtros: FiltroDeAnimais = {}) {
    return requisicao<Pagina<Animal>>(`/api/v1/painel/animais?${parametros(filtros)}`, { token });
  },

  resumo(token: string) {
    return requisicao<ResumoDoAbrigo>("/api/v1/painel/resumo", { token });
  },

  especies(token: string) {
    return requisicao<FatiaDeEspecie[]>("/api/v1/painel/especies", { token });
  },

  adocoesPorMes(token: string, meses = 12) {
    return requisicao<AdocoesNoMes[]>(`/api/v1/painel/adocoes-por-mes?meses=${meses}`, { token });
  },

  candidaturas(token: string, status?: string) {
    const busca = new URLSearchParams({ size: "50" });
    if (status) busca.set("status", status);
    return requisicao<Pagina<Candidatura>>(`/api/v1/candidaturas?${busca}`, { token });
  },

  candidaturasDoAnimal(token: string, id: number | string) {
    return requisicao<Candidatura[]>(`/api/v1/animais/${id}/candidaturas`, { token });
  },

  analisar(token: string, id: number) {
    return requisicao<Candidatura>(`/api/v1/candidaturas/${id}/analise`, { metodo: "POST", token });
  },

  aprovar(token: string, id: number) {
    return requisicao<Candidatura>(`/api/v1/candidaturas/${id}/aprovacao`, { metodo: "POST", token });
  },

  recusar(token: string, id: number, motivo: string) {
    return requisicao<Candidatura>(`/api/v1/candidaturas/${id}/recusa`, {
      metodo: "POST",
      corpo: { motivo },
      token
    });
  },

  concluirAdocao(token: string, id: number) {
    return requisicao<Candidatura>(`/api/v1/candidaturas/${id}/adocao`, { metodo: "POST", token });
  },

  enviarFoto(token: string, id: number | string, arquivo: File,
             credito: { autor?: string; licenca?: string; fonte?: string } = {}) {
    const formulario = new FormData();
    formulario.append("arquivo", arquivo);
    const busca = new URLSearchParams();
    if (credito.autor) busca.set("autor", credito.autor);
    if (credito.licenca) busca.set("licenca", credito.licenca);
    if (credito.fonte) busca.set("fonte", credito.fonte);
    const sufixo = busca.toString() ? `?${busca}` : "";
    return requisicao<Foto>(`/api/v1/animais/${id}/foto${sufixo}`, {
      metodo: "PUT",
      formulario,
      token
    });
  },

  removerFoto(token: string, id: number | string) {
    return requisicao<void>(`/api/v1/animais/${id}/foto`, { metodo: "DELETE", token });
  },

  devolver(token: string, id: number | string, motivo?: string) {
    const busca = motivo ? `?motivo=${encodeURIComponent(motivo)}` : "";
    return requisicao<Animal>(`/api/v1/animais/${id}/devolucao${busca}`, { metodo: "POST", token });
  }
};
