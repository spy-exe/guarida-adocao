"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
  A unica peca em tres dimensoes do sistema e a plaquinha de coleira, porque e
  o objeto que marca que um animal deixou de ser de ninguem e passou a ser de
  alguem. Ela pendura de uma argola e balanca como pendura de verdade:

    aceleracao angular = -(g / comprimento) * sen(angulo) - atrito * velocidade

  O seno importa. Trocar por uma mola linear daria um vaivem de metronomo, e
  pendulo de verdade desacelera perto do ponto mais alto. Alem do balanco, a
  peca gira no proprio eixo, o que deixa ver o verso gravado.

  A gravacao vem de um canvas 2D com relevo desenhado em duas passadas, uma
  clara deslocada e uma escura por cima, que e como se faz baixo relevo em
  imagem sem precisar de mapa de normais.
*/

const RAIO_DA_PECA = 0.86;
const COMPRIMENTO_DO_FIO = 1.35;
const GRAVIDADE = 9.81;

const VERTICE = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalMundo;
  varying vec3 vVisao;

  void main() {
    vUv = uv;
    vec4 mundo = modelMatrix * vec4(position, 1.0);
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    vVisao = normalize(cameraPosition - mundo.xyz);
    gl_Position = projectionMatrix * viewMatrix * mundo;
  }
`;

const FRAGMENTO = /* glsl */ `
  precision highp float;

  uniform sampler2D uFrente;
  uniform sampler2D uVerso;
  uniform float uTempo;
  uniform vec3 uMetalBaixo;
  uniform vec3 uMetalAlto;

  varying vec2 vUv;
  varying vec3 vNormalMundo;
  varying vec3 vVisao;

  float ruido(float semente) {
    return fract(sin(semente * 91.3458) * 47453.5453);
  }

  void main() {
    // a peca e um disco: fora do raio nao existe metal
    vec2 doCentro = vUv - 0.5;
    float distancia = length(doCentro);
    float recorte = 1.0 - smoothstep(0.482, 0.5, distancia);
    if (recorte <= 0.001) discard;

    vec3 normal = normalize(vNormalMundo);
    vec3 visao = normalize(vVisao);
    float rasante = pow(1.0 - abs(dot(normal, visao)), 2.4);

    // escovado circular: a estria acompanha o angulo, como em plaquinha torneada
    float angulo = atan(doCentro.y, doCentro.x);
    float estria = ruido(floor(angulo * 90.0)) * 0.05 - 0.025;

    vec3 metal = mix(uMetalBaixo, uMetalAlto, smoothstep(0.0, 1.0, vUv.y));
    metal += estria;
    metal += rasante * 0.18;

    // varredura de luz, morna e lenta
    float varredura = pow(0.5 + 0.5 * sin((vUv.x + vUv.y) * 3.1 - uTempo * 0.5), 10.0);
    metal += vec3(0.98, 0.95, 0.88) * varredura * 0.12;

    // borda levantada, que e o que faz o disco parecer estampado e nao recortado
    float aro = smoothstep(0.44, 0.47, distancia) * (1.0 - smoothstep(0.478, 0.5, distancia));
    metal += aro * 0.10;

    vec4 gravacao = gl_FrontFacing
        ? texture2D(uFrente, vUv)
        : texture2D(uVerso, vec2(1.0 - vUv.x, vUv.y));

    vec3 cor = mix(metal, gravacao.rgb * (0.9 + rasante * 0.5), gravacao.a);

    gl_FragColor = vec4(cor, recorte);
  }
`;

interface Props {
  nome?: string;
  linhaDeBaixo?: string;
  identificador?: string;
  altura?: number | string;
}

function desenharFace(canvas: HTMLCanvasElement, linhas: string[], fonteDisplay: string,
                      fonteMono: string, principal: boolean) {
  const contexto = canvas.getContext("2d");
  if (!contexto) return;

  const lado = canvas.width;
  contexto.clearRect(0, 0, lado, lado);
  contexto.textAlign = "center";
  contexto.textBaseline = "middle";

  // furo por onde passa a argola, aberto no topo da peca
  contexto.save();
  contexto.globalCompositeOperation = "source-over";
  contexto.beginPath();
  contexto.arc(lado / 2, lado * 0.115, lado * 0.038, 0, Math.PI * 2);
  contexto.fillStyle = "rgba(18, 20, 18, 0.92)";
  contexto.fill();
  contexto.restore();

  /** Relevo em duas passadas: uma clara deslocada, uma escura por cima. */
  function gravar(texto: string, y: number, tamanho: number, fonte: string, espaco: number) {
    const deslocamento = Math.max(1, lado * 0.0032);
    contexto!.letterSpacing = `${espaco}px`;

    contexto!.font = `600 ${tamanho}px ${fonte}`;
    contexto!.fillStyle = "rgba(255, 253, 246, 0.85)";
    contexto!.fillText(texto, lado / 2 + deslocamento, y + deslocamento);

    contexto!.fillStyle = "rgba(30, 36, 30, 0.95)";
    contexto!.fillText(texto, lado / 2, y);
  }

  if (principal) {
    gravar(linhas[0] ?? "", lado * 0.42, lado * 0.145, fonteDisplay, lado * 0.004);
    if (linhas[1]) {
      gravar(linhas[1], lado * 0.60, lado * 0.052, fonteMono, lado * 0.012);
    }
    if (linhas[2]) {
      gravar(linhas[2], lado * 0.70, lado * 0.046, fonteMono, lado * 0.010);
    }
  } else {
    gravar("GUARIDA", lado * 0.40, lado * 0.078, fonteDisplay, lado * 0.014);
    gravar("ABRIGO E ADOCAO", lado * 0.52, lado * 0.040, fonteMono, lado * 0.012);
    gravar("SE ME ACHAR", lado * 0.66, lado * 0.038, fonteMono, lado * 0.010);
    gravar("LEVE PARA CASA", lado * 0.73, lado * 0.038, fonteMono, lado * 0.010);
  }
}

export default function PlaquinhaDeColeira({
  nome = "GUARIDA",
  linhaDeBaixo = "ABRIGO E ADOCAO",
  identificador,
  altura = "100%"
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const pintar = useRef<(() => void) | null>(null);

  useEffect(() => {
    const alvo = container.current;
    if (!alvo) return;

    const paradoPorPreferencia = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderizador: THREE.WebGLRenderer;
    try {
      renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // sem WebGL o palco fica com o proprio fundo, sem quebrar a pagina
    }

    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderizador.setSize(alvo.clientWidth, alvo.clientHeight, false);
    alvo.appendChild(renderizador.domElement);
    renderizador.domElement.style.width = "100%";
    renderizador.domElement.style.height = "100%";

    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, alvo.clientWidth / alvo.clientHeight, 0.1, 40);

    /*
      A distancia da camera nao pode ser fixa: a peca vive em caixas de altura
      diferente, e o que cabe numa corta na outra. Aqui ela e calculada a partir
      do espaco que o conjunto ocupa, pelos dois eixos, e fica com a maior das
      duas exigencias.
    */
    const ALTURA_DO_CONJUNTO = RAIO_DA_PECA * 2 + 1.05;
    const LARGURA_DO_CONJUNTO = RAIO_DA_PECA * 2 + 0.5;

    function enquadrar() {
      const meioAngulo = ((camera.fov * Math.PI) / 180) / 2;
      const porAltura = (ALTURA_DO_CONJUNTO / 2) / Math.tan(meioAngulo);
      const porLargura = (LARGURA_DO_CONJUNTO / 2) / Math.tan(meioAngulo) / Math.max(camera.aspect, 0.2);

      camera.position.set(0, -COMPRIMENTO_DO_FIO + RAIO_DA_PECA * 0.1,
              Math.max(porAltura, porLargura) * 1.08);
      camera.updateProjectionMatrix();
    }

    enquadrar();

    const frente = document.createElement("canvas");
    frente.width = 768;
    frente.height = 768;
    const verso = document.createElement("canvas");
    verso.width = 768;
    verso.height = 768;

    const texturaFrente = new THREE.CanvasTexture(frente);
    const texturaVerso = new THREE.CanvasTexture(verso);
    for (const textura of [texturaFrente, texturaVerso]) {
      textura.colorSpace = THREE.SRGBColorSpace;
      textura.anisotropy = renderizador.capabilities.getMaxAnisotropy();
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTICE,
      fragmentShader: FRAGMENTO,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uFrente: { value: texturaFrente },
        uVerso: { value: texturaVerso },
        uTempo: { value: 0 },
        uMetalBaixo: { value: new THREE.Color("#9aa093") },
        uMetalAlto: { value: new THREE.Color("#dcded2") }
      }
    });

    // o pivo fica na argola: e em torno dele que a peca balanca
    const pivo = new THREE.Group();
    pivo.position.set(0, COMPRIMENTO_DO_FIO, 0);
    cena.add(pivo);

    const argola = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.042, 14, 44),
      new THREE.MeshBasicMaterial({ color: "#a7ab9d" })
    );
    pivo.add(argola);

    const suspensao = new THREE.Group();
    pivo.add(suspensao);

    const peca = new THREE.Mesh(new THREE.PlaneGeometry(RAIO_DA_PECA * 2, RAIO_DA_PECA * 2, 1, 1), material);
    peca.position.set(0, -COMPRIMENTO_DO_FIO + 0.06, 0);
    suspensao.add(peca);

    const elo = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.03, 12, 34),
      new THREE.MeshBasicMaterial({ color: "#a7ab9d" })
    );
    elo.position.set(0, -COMPRIMENTO_DO_FIO + RAIO_DA_PECA + 0.045, 0);
    elo.rotation.x = Math.PI / 2.2;
    suspensao.add(elo);

    // estado do pendulo
    let angulo = 0.16;
    let velocidade = 0;
    let giro = 0;
    let velocidadeDoGiro = 0;

    let arrastando = false;
    const ultimo = { x: 0, y: 0 };

    const tela = renderizador.domElement;
    tela.style.cursor = "grab";
    tela.style.touchAction = "pan-y";

    function aoPressionar(evento: PointerEvent) {
      arrastando = true;
      ultimo.x = evento.clientX;
      ultimo.y = evento.clientY;
      velocidade = 0;
      velocidadeDoGiro = 0;
      tela.style.cursor = "grabbing";
      tela.setPointerCapture(evento.pointerId);
    }

    function aoArrastar(evento: PointerEvent) {
      if (!arrastando) return;

      const dx = evento.clientX - ultimo.x;
      const dy = evento.clientY - ultimo.y;
      ultimo.x = evento.clientX;
      ultimo.y = evento.clientY;

      // arrasto lateral empurra o pendulo, arrasto vertical gira no proprio eixo
      velocidade = -dx * 0.012;
      velocidadeDoGiro = dy * 0.010;
      angulo = Math.max(-1.15, Math.min(1.15, angulo + velocidade));
      giro += velocidadeDoGiro;
    }

    function aoSoltar(evento: PointerEvent) {
      if (!arrastando) return;
      arrastando = false;
      tela.style.cursor = "grab";
      if (tela.hasPointerCapture(evento.pointerId)) tela.releasePointerCapture(evento.pointerId);
    }

    tela.addEventListener("pointerdown", aoPressionar);
    tela.addEventListener("pointermove", aoArrastar);
    tela.addEventListener("pointerup", aoSoltar);
    tela.addEventListener("pointercancel", aoSoltar);

    const relogio = new THREE.Clock();
    let quadro = 0;

    function desenhar() {
      quadro = requestAnimationFrame(desenhar);

      const passo = Math.min(relogio.getDelta(), 0.05);

      if (!arrastando) {
        // pendulo simples com atrito: o seno e o que faz ele desacelerar no alto
        const aceleracao = -(GRAVIDADE / (COMPRIMENTO_DO_FIO * 6.0)) * Math.sin(angulo)
                - 0.9 * velocidade;
        velocidade += aceleracao * passo;
        angulo += velocidade * passo;

        velocidadeDoGiro *= 0.975;
        giro += velocidadeDoGiro;

        if (Math.abs(velocidadeDoGiro) < 0.00004) velocidadeDoGiro = 0;
      }

      const emRepouso = !arrastando && Math.abs(velocidade) < 0.0008
              && Math.abs(angulo) < 0.004 && velocidadeDoGiro === 0;

      if (paradoPorPreferencia && emRepouso) {
        return;
      }
      if (!paradoPorPreferencia) {
        material.uniforms.uTempo.value = relogio.getElapsedTime();
      }

      suspensao.rotation.z = angulo;
      peca.rotation.y = giro;
      elo.rotation.y = giro;

      renderizador.render(cena, camera);
    }

    const observador = new ResizeObserver(() => {
      if (!alvo.clientWidth || !alvo.clientHeight) return;
      renderizador.setSize(alvo.clientWidth, alvo.clientHeight, false);
      camera.aspect = alvo.clientWidth / alvo.clientHeight;
      enquadrar();
      renderizador.render(cena, camera);
    });
    observador.observe(alvo);

    pintar.current = () => {
      const raiz = getComputedStyle(document.documentElement);
      const fonteDisplay = raiz.getPropertyValue("--fonte-display").trim() || "Georgia, serif";
      const fonteMono = raiz.getPropertyValue("--fonte-mono").trim() || "ui-monospace, monospace";

      desenharFace(frente, [
        alvo.dataset.nome ?? "",
        alvo.dataset.linha ?? "",
        alvo.dataset.identificador ?? ""
      ], fonteDisplay, fonteMono, true);
      desenharFace(verso, [], fonteDisplay, fonteMono, false);

      texturaFrente.needsUpdate = true;
      texturaVerso.needsUpdate = true;
    };
    pintar.current();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => pintar.current?.());
    }

    if (paradoPorPreferencia) {
      angulo = 0.05;
      velocidade = 0;
      material.uniforms.uTempo.value = 2.2;
    }

    quadro = requestAnimationFrame(desenhar);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      tela.removeEventListener("pointerdown", aoPressionar);
      tela.removeEventListener("pointermove", aoArrastar);
      tela.removeEventListener("pointerup", aoSoltar);
      tela.removeEventListener("pointercancel", aoSoltar);
      pintar.current = null;
      peca.geometry.dispose();
      argola.geometry.dispose();
      elo.geometry.dispose();
      material.dispose();
      texturaFrente.dispose();
      texturaVerso.dispose();
      renderizador.dispose();
      renderizador.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const alvo = container.current;
    if (!alvo) return;
    alvo.dataset.nome = nome.toUpperCase();
    alvo.dataset.linha = linhaDeBaixo.toUpperCase();
    alvo.dataset.identificador = identificador ?? "";
    pintar.current?.();
  }, [nome, linhaDeBaixo, identificador]);

  return (
    <div
      ref={container}
      style={{ width: "100%", height: typeof altura === "number" ? `${altura}px` : altura }}
      aria-hidden="true"
    />
  );
}
