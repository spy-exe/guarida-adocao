/*
  Percorre o catalogo e o painel em um Chromium headless e grava as telas em
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
  await pagina.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });

  const registro = [];
  pagina.on("console", (msg) => {
    if (msg.type() === "error") registro.push(msg.text());
  });
  pagina.on("pageerror", (erro) => registro.push(String(erro)));

  async function print(nome) {
    await espera(700);
    await pagina.screenshot({ path: `${PASTA}${nome}.png` });
    console.log(`gravado ${nome}.png`);
  }

  // 1. catalogo publico
  await pagina.goto(ENDERECO, { waitUntil: "networkidle0" });
  await espera(1800); // deixa a plaquinha assentar no pendulo
  await print("01-catalogo");

  // 2. ficha de um animal, com a caderneta e o pedido de adocao
  const ficha = await pagina.evaluate(() => {
    const cartao = document.querySelector(".cartao");
    return cartao ? cartao.getAttribute("href") : null;
  });
  await pagina.goto(`${ENDERECO}${ficha}`, { waitUntil: "networkidle0" });
  await espera(1500);
  await print("02-ficha-do-animal");

  await pagina.evaluate(() => window.scrollTo(0, 700));
  await espera(600);
  await print("03-pedido-de-adocao");

  // 3. entrada do abrigo
  await pagina.goto(`${ENDERECO}/entrar`, { waitUntil: "networkidle0" });
  await espera(1500);
  await print("04-entrar");

  await pagina.type('input[type="email"]', CONTA.email);
  await pagina.type('input[type="password"]', CONTA.senha);
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: "networkidle0" }),
    pagina.click('button[type="submit"]')
  ]);
  await espera(1200);
  await print("05-painel");

  // 4. cadastro de animal
  await pagina.goto(`${ENDERECO}/painel/novo`, { waitUntil: "networkidle0" });
  await pagina.type('input[placeholder="Bidu"]', "Farofa");
  await pagina.type('input[placeholder="SRD"]', "Vira-lata");
  await pagina.type('input[placeholder="15000"]', "9400");
  await pagina.evaluate(() => {
    const botoes = [...document.querySelectorAll("button.caixa")];
    botoes.slice(0, 2).forEach((botao) => botao.click());
  });
  await espera(700);
  await print("06-cadastrar-animal");

  // 5. gerenciar um animal existente
  await pagina.goto(`${ENDERECO}/painel`, { waitUntil: "networkidle0" });
  const gerenciar = await pagina.evaluate(() => {
    const link = [...document.querySelectorAll(".razao-acoes a")][0];
    return link ? link.getAttribute("href") : null;
  });
  await pagina.goto(`${ENDERECO}${gerenciar}`, { waitUntil: "networkidle0" });
  await espera(900);
  await print("07-gerenciar-animal");

  // 6. fila de pedidos
  await pagina.goto(`${ENDERECO}/painel/candidaturas`, { waitUntil: "networkidle0" });
  await espera(900);
  await print("08-pedidos");

  // 7. telas estreitas
  await pagina.setViewport({ width: 390, height: 860, deviceScaleFactor: 2 });
  await pagina.goto(ENDERECO, { waitUntil: "networkidle0" });
  await espera(1800);
  await print("09-catalogo-celular");

  await pagina.goto(`${ENDERECO}${ficha}`, { waitUntil: "networkidle0" });
  await espera(1200);
  await print("10-ficha-celular");

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
