"use client";

import { useState } from "react";
import Retrato from "@/components/Retrato";
import type { Animal, Especie } from "@/lib/api";
import { matizDoAnimal } from "@/lib/formato";

const TRACOS = [
  { chave: "DOCIL", rotulo: "Docil" },
  { chave: "BRINCALHAO", rotulo: "Brincalhao" },
  { chave: "TIMIDO", rotulo: "Timido" },
  { chave: "CALMO", rotulo: "Calmo" },
  { chave: "AGITADO", rotulo: "Agitado" },
  { chave: "PROTETOR", rotulo: "Protetor" },
  { chave: "SOCIAVEL_COM_CAES", rotulo: "Se da bem com caes" },
  { chave: "SOCIAVEL_COM_GATOS", rotulo: "Se da bem com gatos" },
  { chave: "BOM_COM_CRIANCAS", rotulo: "Bom com criancas" },
  { chave: "PRECISA_DE_ESPACO", rotulo: "Precisa de espaco" }
];

export interface DadosDoFormulario {
  nome: string;
  especie: string;
  raca: string;
  sexo: string;
  porte: string;
  nascimentoEstimado: string;
  pesoEmGramas: string;
  dataDeEntrada: string;
  historia: string;
  observacoesDeSaude: string;
  castrado: boolean;
  vacinado: boolean;
  vermifugado: boolean;
  temperamentos: string[];
}

export function dadosIniciais(animal?: Animal): DadosDoFormulario {
  const hoje = new Date().toISOString().slice(0, 10);

  return {
    nome: animal?.nome ?? "",
    especie: animal?.especie ?? "CACHORRO",
    raca: animal?.raca ?? "",
    sexo: animal?.sexo ?? "MACHO",
    porte: animal?.porte ?? "MEDIO",
    nascimentoEstimado: animal?.nascimentoEstimado ?? "",
    pesoEmGramas: animal ? String(animal.pesoEmGramas) : "",
    dataDeEntrada: animal?.dataDeEntrada ?? hoje,
    historia: animal?.historia ?? "",
    observacoesDeSaude: animal?.observacoesDeSaude ?? "",
    castrado: animal?.castrado ?? false,
    vacinado: animal?.vacinado ?? false,
    vermifugado: animal?.vermifugado ?? false,
    temperamentos: animal?.temperamentos.map((traco) => traco.chave) ?? []
  };
}

export function corpoDaRequisicao(dados: DadosDoFormulario, comEntrada: boolean) {
  const base = {
    nome: dados.nome,
    especie: dados.especie,
    raca: dados.raca || undefined,
    sexo: dados.sexo,
    porte: dados.porte,
    nascimentoEstimado: dados.nascimentoEstimado || undefined,
    pesoEmGramas: dados.pesoEmGramas ? Number(dados.pesoEmGramas) : undefined,
    historia: dados.historia || undefined,
    observacoesDeSaude: dados.observacoesDeSaude || undefined,
    castrado: dados.castrado,
    vacinado: dados.vacinado,
    vermifugado: dados.vermifugado,
    temperamentos: dados.temperamentos
  };

  return comEntrada ? { ...base, dataDeEntrada: dados.dataDeEntrada || undefined } : base;
}

interface Props {
  dados: DadosDoFormulario;
  aoMudar: (dados: DadosDoFormulario) => void;
  campos: Record<string, string>;
  mostrarEntrada: boolean;
  idParaRetrato?: number;
}

export default function FormularioDeAnimal({ dados, aoMudar, campos, mostrarEntrada,
                                            idParaRetrato = 1 }: Props) {
  const [expandido, setExpandido] = useState(false);

  function trocar<C extends keyof DadosDoFormulario>(campo: C, valor: DadosDoFormulario[C]) {
    aoMudar({ ...dados, [campo]: valor });
  }

  function alternarTraco(chave: string) {
    const atuais = dados.temperamentos;
    trocar("temperamentos", atuais.includes(chave)
      ? atuais.filter((traco) => traco !== chave)
      : [...atuais, chave]);
  }

  return (
    <>
      <div className="dupla">
        <label className="campo">
          <span>Nome</span>
          <input value={dados.nome} onChange={(e) => trocar("nome", e.target.value)}
                 placeholder="Bidu" maxLength={60} required />
          {campos.nome && <em className="campo-erro">{campos.nome}</em>}
        </label>

        <label className="campo">
          <span>Especie</span>
          <select value={dados.especie} onChange={(e) => trocar("especie", e.target.value)}>
            <option value="CACHORRO">Cachorro</option>
            <option value="GATO">Gato</option>
            <option value="COELHO">Coelho</option>
            <option value="PASSARO">Passaro</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>
      </div>

      <div className="tripla">
        <label className="campo">
          <span>Raca</span>
          <input value={dados.raca} onChange={(e) => trocar("raca", e.target.value)}
                 placeholder="SRD" maxLength={60} />
        </label>

        <label className="campo">
          <span>Sexo</span>
          <select value={dados.sexo} onChange={(e) => trocar("sexo", e.target.value)}>
            <option value="MACHO">Macho</option>
            <option value="FEMEA">Femea</option>
          </select>
        </label>

        <label className="campo">
          <span>Porte</span>
          <select value={dados.porte} onChange={(e) => trocar("porte", e.target.value)}>
            <option value="PEQUENO">Pequeno</option>
            <option value="MEDIO">Medio</option>
            <option value="GRANDE">Grande</option>
          </select>
        </label>
      </div>

      <div className={mostrarEntrada ? "tripla" : "dupla"}>
        <label className="campo">
          <span>Nascimento estimado</span>
          <input type="date" value={dados.nascimentoEstimado}
                 onChange={(e) => trocar("nascimentoEstimado", e.target.value)} required />
          {campos.nascimentoEstimado && <em className="campo-erro">{campos.nascimentoEstimado}</em>}
        </label>

        <label className="campo">
          <span>Peso em gramas</span>
          <input inputMode="numeric" value={dados.pesoEmGramas}
                 onChange={(e) => trocar("pesoEmGramas", e.target.value.replace(/\D/g, ""))}
                 placeholder="15000" required />
          {campos.pesoEmGramas && <em className="campo-erro">{campos.pesoEmGramas}</em>}
        </label>

        {mostrarEntrada && (
          <label className="campo">
            <span>Entrada no abrigo</span>
            <input type="date" value={dados.dataDeEntrada}
                   onChange={(e) => trocar("dataDeEntrada", e.target.value)} required />
            {campos.dataDeEntrada && <em className="campo-erro">{campos.dataDeEntrada}</em>}
          </label>
        )}
      </div>

      {campos.entradaDepoisDoNascimento && (
        <p className="aviso">{campos.entradaDepoisDoNascimento}</p>
      )}

      <label className="campo">
        <span>Historia</span>
        <textarea value={dados.historia} onChange={(e) => trocar("historia", e.target.value)}
                  maxLength={1000}
                  placeholder="Como chegou, o que ja passou, do que gosta" />
      </label>

      <div className="caixas">
        {(["castrado", "vacinado", "vermifugado"] as const).map((campo) => (
          <label className="caixa" key={campo} data-marcada={dados[campo] ? "sim" : "nao"}>
            <input type="checkbox" checked={dados[campo]}
                   onChange={(e) => trocar(campo, e.target.checked)} />
            {campo === "castrado" ? "Castrado" : campo === "vacinado" ? "Vacinado" : "Vermifugado"}
          </label>
        ))}
      </div>

      <div className="campo">
        <span>Temperamento</span>
        <div className="caixas">
          {(expandido ? TRACOS : TRACOS.slice(0, 6)).map((traco) => (
            <button
              type="button"
              className="caixa"
              key={traco.chave}
              data-marcada={dados.temperamentos.includes(traco.chave) ? "sim" : "nao"}
              onClick={() => alternarTraco(traco.chave)}
            >
              {traco.rotulo}
            </button>
          ))}
          {!expandido && (
            <button type="button" className="caixa" onClick={() => setExpandido(true)}>
              mais {TRACOS.length - 6}
            </button>
          )}
        </div>
      </div>

      <label className="campo">
        <span>Observacoes de saude</span>
        <textarea value={dados.observacoesDeSaude}
                  onChange={(e) => trocar("observacoesDeSaude", e.target.value)}
                  maxLength={500}
                  placeholder="Tratamento em curso, alergia, dieta" />
      </label>

      <div className="apenas-leitor-de-tela">
        <Retrato especie={dados.especie as Especie} cor={matizDoAnimal(idParaRetrato)} />
      </div>
    </>
  );
}
