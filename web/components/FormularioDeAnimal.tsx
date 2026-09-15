"use client";

import { Pill, Scissors, Syringe } from "lucide-react";
import Campo from "@/components/Campo";
import IconeDaEspecie from "@/components/IconeDaEspecie";
import type { Animal, Especie } from "@/lib/api";

export const TRACOS = [
  { chave: "DOCIL", rotulo: "Dócil" },
  { chave: "BRINCALHAO", rotulo: "Brincalhão" },
  { chave: "CALMO", rotulo: "Calmo" },
  { chave: "TIMIDO", rotulo: "Tímido" },
  { chave: "AGITADO", rotulo: "Agitado" },
  { chave: "PROTETOR", rotulo: "Protetor" },
  { chave: "SOCIAVEL_COM_CAES", rotulo: "Se dá bem com cães" },
  { chave: "SOCIAVEL_COM_GATOS", rotulo: "Se dá bem com gatos" },
  { chave: "BOM_COM_CRIANCAS", rotulo: "Bom com crianças" },
  { chave: "PRECISA_DE_ESPACO", rotulo: "Precisa de espaço" }
];

const ESPECIES: Array<{ chave: Especie; rotulo: string }> = [
  { chave: "CACHORRO", rotulo: "Cachorro" },
  { chave: "GATO", rotulo: "Gato" },
  { chave: "COELHO", rotulo: "Coelho" },
  { chave: "PASSARO", rotulo: "Pássaro" },
  { chave: "OUTRO", rotulo: "Outro" }
];

export interface DadosDoFormulario {
  nome: string;
  especie: Especie;
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

export function dadosIniciais(animal?: Animal, hoje: Date = new Date()): DadosDoFormulario {
  return {
    nome: animal?.nome ?? "",
    especie: animal?.especie ?? "CACHORRO",
    raca: animal?.raca ?? "",
    sexo: animal?.sexo ?? "MACHO",
    porte: animal?.porte ?? "MEDIO",
    nascimentoEstimado: animal?.nascimentoEstimado ?? "",
    pesoEmGramas: animal ? String(animal.pesoEmGramas) : "",
    dataDeEntrada: animal?.dataDeEntrada ?? hoje.toISOString().slice(0, 10),
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
    nome: dados.nome.trim(),
    especie: dados.especie,
    raca: dados.raca.trim() || undefined,
    sexo: dados.sexo,
    porte: dados.porte,
    nascimentoEstimado: dados.nascimentoEstimado || undefined,
    pesoEmGramas: dados.pesoEmGramas ? Number(dados.pesoEmGramas) : undefined,
    historia: dados.historia.trim() || undefined,
    observacoesDeSaude: dados.observacoesDeSaude.trim() || undefined,
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
  erros: Record<string, string>;
  mostrarEntrada: boolean;
}

export default function FormularioDeAnimal({ dados, aoMudar, erros, mostrarEntrada }: Props) {
  function trocar<C extends keyof DadosDoFormulario>(campo: C, valor: DadosDoFormulario[C]) {
    aoMudar({ ...dados, [campo]: valor });
  }

  function alternarTraco(chave: string) {
    trocar("temperamentos", dados.temperamentos.includes(chave)
      ? dados.temperamentos.filter((traco) => traco !== chave)
      : [...dados.temperamentos, chave]);
  }

  return (
    <>
      <Campo id="nome" rotulo="Nome" erro={erros.nome}>
        <input id="nome" value={dados.nome} maxLength={60} required placeholder="Como o abrigo chama o animal"
               onChange={(e) => trocar("nome", e.target.value)} />
      </Campo>

      <div className="campo">
        <span className="campo-rotulo" id="rotulo-especie">Espécie</span>
        <div className="opcoes" role="group" aria-labelledby="rotulo-especie">
          {ESPECIES.map((opcao) => (
            <button key={opcao.chave} type="button" className="opcao" aria-pressed={dados.especie === opcao.chave}
                    onClick={() => trocar("especie", opcao.chave)}>
              <IconeDaEspecie especie={opcao.chave} size={15} />{opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="tripla">
        <Campo id="raca" rotulo="Raça" ajuda="Pode deixar em branco se não souber">
          <input id="raca" value={dados.raca} maxLength={60} placeholder="Sem raça definida"
                 onChange={(e) => trocar("raca", e.target.value)} />
        </Campo>
        <Campo id="sexo" rotulo="Sexo">
          <select id="sexo" value={dados.sexo} onChange={(e) => trocar("sexo", e.target.value)}>
            <option value="MACHO">Macho</option>
            <option value="FEMEA">Fêmea</option>
          </select>
        </Campo>
        <Campo id="porte" rotulo="Porte">
          <select id="porte" value={dados.porte} onChange={(e) => trocar("porte", e.target.value)}>
            <option value="PEQUENO">Pequeno</option>
            <option value="MEDIO">Médio</option>
            <option value="GRANDE">Grande</option>
          </select>
        </Campo>
      </div>

      <div className={mostrarEntrada ? "tripla" : "dupla"}>
        <Campo id="nascimento" rotulo="Nascimento estimado" erro={erros.nascimentoEstimado ?? erros.entradaDepoisDoNascimento}>
          <input id="nascimento" type="date" value={dados.nascimentoEstimado} required
                 onChange={(e) => trocar("nascimentoEstimado", e.target.value)} />
        </Campo>
        <Campo id="peso" rotulo="Peso em gramas" erro={erros.pesoEmGramas} ajuda="Um gato adulto pesa por volta de 4000">
          <input id="peso" inputMode="numeric" value={dados.pesoEmGramas} required
                 onChange={(e) => trocar("pesoEmGramas", e.target.value.replace(/\D/g, ""))} />
        </Campo>
        {mostrarEntrada && (
          <Campo id="entrada" rotulo="Chegou ao abrigo em" erro={erros.dataDeEntrada}>
            <input id="entrada" type="date" value={dados.dataDeEntrada} required
                   onChange={(e) => trocar("dataDeEntrada", e.target.value)} />
          </Campo>
        )}
      </div>

      <div className="campo">
        <span className="campo-rotulo" id="rotulo-cuidados">Cuidados já feitos</span>
        <div className="opcoes" role="group" aria-labelledby="rotulo-cuidados">
          <button type="button" className="opcao" aria-pressed={dados.vacinado} onClick={() => trocar("vacinado", !dados.vacinado)}>
            <Syringe size={15} aria-hidden="true" />Vacinado
          </button>
          <button type="button" className="opcao" aria-pressed={dados.castrado} onClick={() => trocar("castrado", !dados.castrado)}>
            <Scissors size={15} aria-hidden="true" />Castrado
          </button>
          <button type="button" className="opcao" aria-pressed={dados.vermifugado} onClick={() => trocar("vermifugado", !dados.vermifugado)}>
            <Pill size={15} aria-hidden="true" />Vermifugado
          </button>
        </div>
      </div>

      <div className="campo">
        <span className="campo-rotulo" id="rotulo-tracos">Jeito de ser</span>
        <div className="opcoes" role="group" aria-labelledby="rotulo-tracos">
          {TRACOS.map((traco) => (
            <button key={traco.chave} type="button" className="opcao"
                    aria-pressed={dados.temperamentos.includes(traco.chave)} onClick={() => alternarTraco(traco.chave)}>
              {traco.rotulo}
            </button>
          ))}
        </div>
      </div>

      <Campo id="historia" rotulo="História" ajuda="Como chegou, do que gosta, o que já passou">
        <textarea id="historia" value={dados.historia} maxLength={1000} onChange={(e) => trocar("historia", e.target.value)} />
      </Campo>

      <Campo id="saude" rotulo="Observações de saúde">
        <textarea id="saude" value={dados.observacoesDeSaude} maxLength={500} placeholder="Tratamento em curso, alergia, dieta"
                  onChange={(e) => trocar("observacoesDeSaude", e.target.value)} />
      </Campo>
    </>
  );
}
