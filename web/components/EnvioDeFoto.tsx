"use client";

import { useRef, useState } from "react";
import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import Campo from "@/components/Campo";
import FotoDoAnimal from "@/components/FotoDoAnimal";
import { api, ErroDaApi, type Animal } from "@/lib/api";

const TAMANHO_MAXIMO = 2 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

/** Confere no navegador o que a API vai conferir de novo, para o erro aparecer antes do envio. */
export function problemaDoArquivo(arquivo: File): string | null {
  if (!TIPOS.includes(arquivo.type)) return "Use uma foto JPEG, PNG ou WEBP.";
  if (arquivo.size > TAMANHO_MAXIMO) return "A foto passa de 2 MB. Reduza antes de enviar.";
  return null;
}

export default function EnvioDeFoto({ animal, token, aoMudar }:
  { animal: Animal; token: string; aoMudar: () => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [autor, setAutor] = useState(animal.foto?.autor ?? "");
  const [licenca, setLicenca] = useState(animal.foto?.licenca ?? "");
  const [fonte, setFonte] = useState(animal.foto?.fonte ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(arquivo: File) {
    const problema = problemaDoArquivo(arquivo);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await api.enviarFoto(token, animal.id, arquivo, { autor, licenca, fonte });
      aoMudar();
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A foto não foi enviada.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setEnviando(true);
    try {
      await api.removerFoto(token, animal.id);
      aoMudar();
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.message : "A foto não foi removida.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="painel-caixa" aria-labelledby="titulo-foto">
      <h3 id="titulo-foto">Foto</h3>
      <div className="envio-foto">
        <div className="envio-previa"><FotoDoAnimal animal={animal} /></div>

        <div className="formulario">
          <label className="soltar" data-ativo={arrastando ? "sim" : undefined}
                 onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                 onDragLeave={() => setArrastando(false)}
                 onDrop={(e) => {
                   e.preventDefault();
                   setArrastando(false);
                   const arquivo = e.dataTransfer.files[0];
                   if (arquivo) void enviar(arquivo);
                 }}>
            {enviando ? <LoaderCircle size={18} className="girando" aria-hidden="true" /> : <ImageUp size={18} aria-hidden="true" />}
            <span>{animal.foto ? "Trocar a foto" : "Escolher ou arrastar uma foto"}</span>
            <input ref={entrada} type="file" accept={TIPOS.join(",")} aria-label="Arquivo da foto"
                   onChange={(e) => { const arquivo = e.target.files?.[0]; if (arquivo) void enviar(arquivo); }} />
          </label>

          <div className="dupla">
            <Campo id="foto-autor" rotulo="Autor da foto">
              <input id="foto-autor" value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Quem fotografou" />
            </Campo>
            <Campo id="foto-licenca" rotulo="Licença">
              <input id="foto-licenca" value={licenca} onChange={(e) => setLicenca(e.target.value)} placeholder="CC BY 4.0" />
            </Campo>
          </div>
          <Campo id="foto-fonte" rotulo="Link da origem" ajuda="Necessário quando a foto não foi tirada pelo abrigo">
            <input id="foto-fonte" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="https://" />
          </Campo>

          {erro && <p className="aviso" role="alert">{erro}</p>}

          {animal.foto && (
            <button type="button" className="botao" data-tom="perigo" data-tamanho="pequeno" onClick={remover} disabled={enviando}
                    style={{ justifySelf: "start" }}>
              <Trash2 size={15} aria-hidden="true" />Remover foto
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
