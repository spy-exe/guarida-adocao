import type { Especie } from "@/lib/api";

/*
  O abrigo nao tem foto de todo animal, e foto de banco de imagem mentiria
  sobre quem esta ali. Em vez disso cada especie tem um retrato geometrico
  proprio, montado com formas simples para ficar nitido em qualquer tamanho, e
  o fundo de cada ficha ganha um matiz derivado do id: dois animais nunca saem
  iguais na tela, e nenhum deles finge ser uma fotografia.
*/

function Cachorro() {
  return (
    <g fill="currentColor">
      {/* orelha caida: nasce atras da cabeca e desce ao lado, como em vira-lata */}
      <ellipse cx="23" cy="60" rx="10.5" ry="22" transform="rotate(12 23 60)" />
      <ellipse cx="77" cy="60" rx="10.5" ry="22" transform="rotate(-12 77 60)" />
      <ellipse cx="50" cy="50" rx="26" ry="24" />
      <ellipse cx="50" cy="65" rx="13.5" ry="10" fill="#ffffff" fillOpacity="0.22" />
      <ellipse cx="50" cy="60" rx="4.4" ry="3.2" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="40" cy="44" r="3.1" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="60" cy="44" r="3.1" fill="#ffffff" fillOpacity="0.55" />
    </g>
  );
}

function Gato() {
  return (
    <g fill="currentColor">
      <polygon points="27,44 29,16 49,35" />
      <polygon points="73,44 71,16 51,35" />
      <ellipse cx="50" cy="55" rx="25" ry="22" />
      <polygon points="50,60 45,55 55,55" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="41" cy="49" r="3.1" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="59" cy="49" r="3.1" fill="#ffffff" fillOpacity="0.55" />
      <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round">
        <line x1="30" y1="60" x2="16" y2="57" />
        <line x1="30" y1="64" x2="16" y2="65" />
        <line x1="70" y1="60" x2="84" y2="57" />
        <line x1="70" y1="64" x2="84" y2="65" />
      </g>
    </g>
  );
}

function Coelho() {
  return (
    <g fill="currentColor">
      <ellipse cx="39" cy="27" rx="7.5" ry="24" transform="rotate(-9 39 27)" />
      <ellipse cx="61" cy="27" rx="7.5" ry="24" transform="rotate(9 61 27)" />
      <ellipse cx="50" cy="64" rx="22" ry="20" />
      <ellipse cx="50" cy="70" rx="3.6" ry="2.8" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="42" cy="60" r="2.9" fill="#ffffff" fillOpacity="0.55" />
      <circle cx="58" cy="60" r="2.9" fill="#ffffff" fillOpacity="0.55" />
    </g>
  );
}

function Passaro() {
  return (
    <g fill="currentColor">
      <polygon points="24,58 5,46 10,68" />
      <ellipse cx="45" cy="58" rx="24" ry="20" />
      <circle cx="66" cy="40" r="13" />
      <polygon points="77,38 93,44 77,48" />
      <circle cx="70" cy="37" r="2.6" fill="#ffffff" fillOpacity="0.6" />
      <path d="M34 56 q12 -9 24 0 q-12 9 -24 0" fill="#ffffff" fillOpacity="0.2" />
    </g>
  );
}

function Pata() {
  return (
    <g fill="currentColor">
      <ellipse cx="50" cy="68" rx="21" ry="17" />
      <ellipse cx="28" cy="46" rx="8" ry="11" transform="rotate(-18 28 46)" />
      <ellipse cx="43" cy="34" rx="8" ry="12" />
      <ellipse cx="60" cy="34" rx="8" ry="12" />
      <ellipse cx="74" cy="46" rx="8" ry="11" transform="rotate(18 74 46)" />
    </g>
  );
}

const RETRATOS: Record<Especie, () => React.JSX.Element> = {
  CACHORRO: Cachorro,
  GATO: Gato,
  COELHO: Coelho,
  PASSARO: Passaro,
  OUTRO: Pata
};

export default function Retrato({ especie, cor }: { especie: Especie; cor?: string }) {
  const Desenho = RETRATOS[especie] ?? Pata;

  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Ilustracao de ${especie.toLowerCase()}`}
         style={{ color: cor ?? "var(--musgo)" }}>
      <Desenho />
    </svg>
  );
}
