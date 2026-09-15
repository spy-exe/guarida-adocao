/*
  Percorre o catálogo e o painel em um Chromium headless e grava as telas em
  prints/. Serve tanto para conferir o visual sem abrir navegador quanto para
  provar que o fluxo inteiro funciona ponta a ponta contra a API de verdade.

  Uso: node scripts/prints.mjs [endereco]
*/
import { mkdir, rm } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const ENDERECO = process.argv[2] ?? "http://localhost:8080";
const PASTA = new URL("../prints/", import.meta.url).pathname;
const CONTA = { email: "abrigo@guarida.app", senha: "demonstracao2026" };

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function principal() {
  await rm(PASTA, { recursive: true, force: true });
  await mkdir(PASTA, { recursive: true });

  const navegador = await puppeteer.launch({
    executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader"
    ]
  });

  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

  const registro = [];
  pagina.on("console", (msg) => {
    // o 400 do pedido vazio é provocado de propósito para fotografar os erros de campo
    if (msg.type() === "error" && !msg.text().includes("status of 400")) registro.push(msg.text());
  });
  pagina.on("pageerror", (erro) => registro.push(String(erro)));

  async function print(nome) {
    await espera(700);
    await pagina.screenshot({ path: `${PASTA}${nome}.png` });
    console.log(`gravado ${nome}.png`);
  }

  async function abrir(caminho, pausa = 1200) {
    await pagina.goto(`${ENDERECO}${caminho}`, { waitUntil: "networkidle0" });
    await espera(pausa);
  }

  /** Imagem com loading="lazy" só baixa quando entra na tela, então a página é rolada antes do print inteiro. */
  async function inteira(nome) {
    await pagina.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((pronto) => setTimeout(pronto, 120));
      }
      window.scrollTo(0, 0);
    });
    await espera(900);
    await pagina.screenshot({ path: `${PASTA}${nome}.png`, fullPage: true });
    console.log(`gravado ${nome}.png`);
  }

  // 1. catálogo público; a plaquinha precisa de um tempo para assentar no pêndulo
  await abrir("/", 2000);
  await print("01-catalogo");
  await inteira("01b-catalogo-inteiro");

  // a ficha usada nos prints é a de um animal com foto, que é o caso comum
  const ficha = await pagina.evaluate(() =>
    [...document.querySelectorAll(".cartao")].find((c) => c.querySelector("img"))?.getAttribute("href"));
  await abrir("/?especie=GATO");
  await print("02-catalogo-filtrado");

  // 2. ficha do animal e pedido de adoção
  await abrir(ficha, 1600);
  await print("03-ficha-do-animal");
  await inteira("03b-ficha-inteira");

  // pedido vazio mostra os erros de cada campo, sem mandar nada que o abrigo leria
  await pagina.evaluate(() => document.querySelector(".lateral form button[type=submit]")?.click());
  await espera(900);
  await print("04-pedido-com-erros");

  // 3. entrada do abrigo
  await abrir("/entrar");
  await print("05-entrar");
  await pagina.type("#e-email", CONTA.email);
  await pagina.type("#e-senha", CONTA.senha);
  await Promise.all([pagina.waitForNavigation({ waitUntil: "networkidle0" }), pagina.click('button[type="submit"]')]);
  await espera(1400);
  await print("06-painel");
  await inteira("06b-painel-inteiro");

  // 4. cadastro, sem salvar para não deixar animal de mentira na conta pública
  await abrir("/painel/novo");
  await pagina.type("#nome", "Farofa");
  await pagina.type("#raca", "Vira-lata");
  await pagina.type("#peso", "9400");
  await pagina.evaluate(() => [...document.querySelectorAll('[aria-labelledby="rotulo-tracos"] .opcao')].slice(0, 2).forEach((b) => b.click()));
  await espera(500);
  await print("07-cadastrar-animal");

  // 5. gerenciar um animal existente
  await abrir("/painel");
  const gerenciar = await pagina.evaluate(() => document.querySelector(".tabela .linha")?.getAttribute("href"));
  await abrir(gerenciar);
  await print("08-gerenciar-animal");
  await inteira("08b-gerenciar-inteiro");

  // 6. fila de pedidos
  await abrir("/painel/candidaturas");
  await print("09-pedidos");

  // 7. telas estreitas
  // escala 1 no celular: print inteiro acima de 16 mil pixels o Chromium repete pedaços da página
  await pagina.setViewport({ width: 390, height: 860, deviceScaleFactor: 1 });
  await abrir("/painel");
  await inteira("10-painel-celular");
  await abrir("/painel/candidaturas");
  await print("11-pedidos-celular");

  await pagina.evaluate(() => window.localStorage.clear());
  await abrir("/", 2000);
  await inteira("12-catalogo-celular");
  await abrir(ficha);
  await inteira("13-ficha-celular");
  await abrir("/entrar");
  await print("14-entrar-celular");

  await navegador.close();

  if (registro.length > 0) {
    console.log("\nerros no console do navegador:");
    registro.forEach((linha) => console.log(`  ${linha}`));
    process.exitCode = 1;
  } else {
    console.log("\nnenhum erro no console do navegador");
  }
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
