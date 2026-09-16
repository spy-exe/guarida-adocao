/*
  Popula a conta de demonstração chamando a API de verdade, sem escrever no
  banco por fora. Cada animal aqui passou pelo mesmo cadastro que o abrigo usa,
  e cada adoção passou pela mesma aprovação, então o painel mostra o que
  mostraria em uso normal.

  As fotos vêm do Wikimedia Commons, escolhidas uma a uma para bater com a
  espécie e a descrição de cada animal. Autor, licença e página de origem estão
  em fotos.json e sobem junto com a imagem, porque CC BY e CC BY-SA só permitem
  o uso com atribuição. Rodar de novo numa conta já povoada só completa as fotos
  que faltam.

  Uso: node scripts/semear.mjs [endereco]
*/
import { readFile } from "node:fs/promises";

const FOTOS = JSON.parse(await readFile(new URL("./fotos.json", import.meta.url), "utf8"));
const AGENTE = "guarida-semeadura/1.0 (projeto acadêmico; https://github.com/spy-exe/guarida-adocao)";

const ENDERECO = process.argv[2] ?? "http://localhost:8080";
const CONTA = {
  nome: "Abrigo São Francisco",
  email: "abrigo@guarida.app",
  senha: "demonstracao2026",
  cidade: "Niterói",
  telefone: "21999998888"
};

const HOJE = new Date();

function diasAtras(dias) {
  const data = new Date(HOJE);
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}

/** nome, especie, raca, sexo, porte, mesesDeIdade, gramas, diasNoAbrigo, tracos, historia, desfecho */
const ELENCO = [
  ["Bidu", "CACHORRO", "Vira-lata caramelo", "MACHO", "MEDIO", 26, 17000, 210,
    ["DOCIL", "BRINCALHAO", "BOM_COM_CRIANCAS"],
    "Apareceu no portão do abrigo numa noite de chuva, magro e com medo de barulho. Hoje dorme de barriga para cima e late para carteiro por esporte.", "adotado"],
  ["Amora", "GATO", "SRD", "FEMEA", "PEQUENO", 14, 3600, 160,
    ["TIMIDO", "CALMO", "SOCIAVEL_COM_GATOS"],
    "Resgatada de dentro do motor de um carro no estacionamento de um mercado. Levou duas semanas para sair de baixo do sofá, e agora escolhe colo.", "adotado"],
  ["Tobias", "CACHORRO", "Pastor misturado", "MACHO", "GRANDE", 48, 32000, 130,
    ["PROTETOR", "CALMO", "PRECISA_DE_ESPACO"],
    "Ficou dois anos preso numa corrente curta antes de ser resgatado. Precisa de quintal e de gente com paciência, e devolve isso em lealdade.", "disponivel"],
  ["Nina", "CACHORRO", "SRD", "FEMEA", "PEQUENO", 8, 6200, 90,
    ["BRINCALHAO", "AGITADO", "BOM_COM_CRIANCAS"],
    "Nasceu no abrigo, filha da Estrela. Nunca conheceu rua, e por isso é a mais confiada da ninhada.", "processo"],
  ["Frajola", "GATO", "SRD", "MACHO", "PEQUENO", 36, 4800, 300,
    ["CALMO", "SOCIAVEL_COM_CAES"],
    "Vive no abrigo desde filhote e já viu três ninhadas crescerem. É o gato que recebe os novos e mostra onde fica a comida.", "disponivel"],
  ["Estrela", "CACHORRO", "SRD", "FEMEA", "MEDIO", 60, 19000, 340,
    ["DOCIL", "CALMO", "SOCIAVEL_COM_CAES"],
    "Chegou prenha e criou a ninhada inteira no abrigo. Depois que os filhotes foram adotados, ficou esperando a vez dela.", "disponivel"],
  ["Pipoca", "COELHO", "Mini lop", "FEMEA", "PEQUENO", 11, 1900, 70,
    ["TIMIDO", "CALMO"],
    "Entregue por uma família que comprou na feira sem saber que coelho vive oito anos. Come alface na mão de quem senta no chão.", "disponivel"],
  ["Chico", "PASSARO", "Calopsita", "MACHO", "PEQUENO", 30, 320, 55,
    ["AGITADO", "SOCIAVEL_COM_GATOS"],
    "Resgatado de uma gaiola pequena demais, com as penas da asa cortadas. Já voa de novo e assobia o refrão de uma música que ninguém identificou ainda.", "disponivel"],
  ["Mel", "CACHORRO", "Beagle misturado", "FEMEA", "MEDIO", 20, 13500, 120,
    ["BRINCALHAO", "SOCIAVEL_COM_CAES", "BOM_COM_CRIANCAS"],
    "Encontrada na rodovia, com a pata quebrada. A pata soldou torta e ela corre igual, só que de lado.", "adotado"],
  ["Simba", "GATO", "Laranjinha", "MACHO", "MEDIO", 18, 5400, 100,
    ["AGITADO", "BRINCALHAO"],
    "Caiu do telhado de um vizinho e ninguém apareceu para buscar. Sobe em tudo, e por isso o abrigo pede tela nas janelas.", "processo"],
  ["Lola", "CACHORRO", "SRD", "FEMEA", "PEQUENO", 96, 7800, 400,
    ["CALMO", "DOCIL"],
    "Idosa, chegou quando a tutora faleceu e ninguém da família quis ficar. Dorme dezoito horas por dia e acorda para comer.", "disponivel"],
  ["Thor", "CACHORRO", "Pitbull misturado", "MACHO", "GRANDE", 34, 29000, 150,
    ["PROTETOR", "DOCIL", "PRECISA_DE_ESPACO"],
    "Devolvido duas vezes por causa da fama da raça, nunca por comportamento. É o cachorro mais paciente da casa com criança.", "disponivel"],
  ["Kiara", "GATO", "Siamês misturado", "FEMEA", "PEQUENO", 6, 2100, 45,
    ["BRINCALHAO", "AGITADO", "SOCIAVEL_COM_GATOS"],
    "Da ninhada encontrada atras da padaria. A única que miava alto o bastante para ser achada.", "disponivel"],
  ["Bento", "CACHORRO", "Salsicha misturado", "MACHO", "PEQUENO", 44, 8900, 260,
    ["TIMIDO", "CALMO"],
    "Chegou com medo de homem de boné. Levou um ano para aceitar a mão do voluntário que hoje é o preferido dele.", "adotado"],
  ["Jade", "CACHORRO", "SRD", "FEMEA", "MEDIO", 15, 14200, 80,
    ["BRINCALHAO", "SOCIAVEL_COM_CAES", "BOM_COM_CRIANCAS"],
    "Resgatada de uma casa com quinze cães em dois cômodos. Passou a acreditar que comida não vai acabar.", "disponivel"],
  ["Tico", "PASSARO", "Periquito", "MACHO", "PEQUENO", 14, 45, 40,
    ["AGITADO"],
    "Entrou pela janela do abrigo por conta própria e nunca mais saiu. Ninguém reclamou dele em lugar nenhum.", "disponivel"],
  ["Manu", "GATO", "SRD", "FEMEA", "PEQUENO", 42, 4100, 190,
    ["TIMIDO", "PRECISA_DE_ESPACO"],
    "Semiferal, resgatada de um terreno baldio. Aceita comida e cafuné curto, e mais que isso ainda está negociando.", "disponivel"],
  ["Rex", "CACHORRO", "Rottweiler misturado", "MACHO", "GRANDE", 72, 38000, 220,
    ["CALMO", "PROTETOR", "PRECISA_DE_ESPACO"],
    "Cão de guarda de um depósito que fechou. Ficou sozinho no terreno duas semanas antes de alguém avisar.", "disponivel"],
  ["Fiona", "COELHO", "SRD", "FEMEA", "PEQUENO", 24, 2400, 110,
    ["CALMO", "DOCIL"],
    "Devolvida depois da Páscoa, como acontece todo ano. Come cenoura pela ponta e deixa o resto.", "disponivel"],
  ["Zeca", "CACHORRO", "SRD", "MACHO", "MEDIO", 10, 11000, 60,
    ["BRINCALHAO", "AGITADO", "SOCIAVEL_COM_CAES"],
    "Filhote grande que ainda não sabe o tamanho que tem. Derruba tudo por empolgação e pede desculpa depois.", "processo"],
  ["Cacau", "GATO", "Preto", "FEMEA", "PEQUENO", 22, 3900, 170,
    ["DOCIL", "CALMO", "BOM_COM_CRIANCAS"],
    "Gata preta, o que no Brasil ainda faz gente hesitar. Fica no abrigo há mais tempo que gatos de cores comuns que chegaram depois.", "disponivel"],
  ["Duque", "CACHORRO", "SRD", "MACHO", "MEDIO", 54, 16800, 280,
    ["CALMO", "TIMIDO"],
    "Atropelado e abandonado na porta da clínica veterinária. Anda com uma manqueira leve que não incomoda.", "disponivel"],
  ["Alma", "GATO", "SRD", "FEMEA", "PEQUENO", 9, 2700, 50,
    ["BRINCALHAO", "SOCIAVEL_COM_GATOS", "SOCIAVEL_COM_CAES"],
    "Cresceu junto com uma ninhada de cachorro e acha que é cachorro. Busca bolinha.", "disponivel"],
  ["Bartolomeu", "COELHO", "Angora", "MACHO", "MEDIO", 30, 3100, 140,
    ["TIMIDO", "PRECISA_DE_ESPACO"],
    "Precisa de escovação toda semana, o que foi o motivo de ter sido entregue. Fica manso quando escovado.", "disponivel"],
  ["Pérola", "CACHORRO", "Poodle misturado", "FEMEA", "PEQUENO", 84, 6400, 320,
    ["CALMO", "DOCIL", "BOM_COM_CRIANCAS"],
    "Idosa, cega de um olho, chegou com a pelagem toda embolada. Depois da tosa virou outra cachorra.", "disponivel"],
  ["Tupi", "CACHORRO", "SRD", "MACHO", "GRANDE", 28, 26000, 100,
    ["AGITADO", "BRINCALHAO", "PRECISA_DE_ESPACO"],
    "Energia de sobra, precisa de caminhada longa todo dia. Não serve para apartamento e o abrigo avisa antes.", "disponivel"],
  ["Sofia", "GATO", "SRD", "FEMEA", "PEQUENO", 50, 4300, 240,
    ["CALMO", "TIMIDO"],
    "Vivia num pet shop que fechou. Passou a vida inteira em vitrine e ainda estranha espaço aberto.", "disponivel"],
  ["Nero", "GATO", "Preto", "MACHO", "MEDIO", 16, 5100, 85,
    ["PROTETOR", "SOCIAVEL_COM_GATOS"],
    "Chegou junto com a Cacau, do mesmo resgate. Os dois se dão bem e o abrigo prefere que sejam adotados juntos.", "disponivel"]
];

const CANDIDATOS = [
  ["Maria Souza", "maria.souza@exemplo.com", "21988887777", "Niterói", "APARTAMENTO", true, false,
    "Moro sozinha, trabalho de casa três dias por semana e tenho tela em todas as janelas."],
  ["João Lima", "joao.lima@exemplo.com", "21977776666", "São Gonçalo", "CASA", true, true,
    "Tenho quintal murado e já tenho uma cadela de sete anos, castrada e sociável."],
  ["Beatriz Andrade", "beatriz@exemplo.com", "21966665555", "Maricá", "SITIO", true, true,
    "Sítio com dois hectares cercados. Já adotei três cães daqui nos últimos anos."],
  ["Carlos Nunes", "carlos.nunes@exemplo.com", "21955554444", "Rio de Janeiro", "APARTAMENTO", false, false,
    "Apartamento no oitavo andar. Ainda vou instalar as telas."],
  ["Fernanda Rocha", "fernanda@exemplo.com", "21944443333", "Niterói", "CASA", true, false,
    "Casa com quintal, dois filhos de dez e treze anos, ambos querem muito."],
  ["Rafael Teixeira", "rafael.t@exemplo.com", "21933332222", "Itaboraí", "CASA", true, true,
    "Tenho dois gatos castrados. Quero um terceiro que se dê bem com eles."],
  ["Luiza Prado", "luiza.prado@exemplo.com", "21922221111", "Niterói", "APARTAMENTO", true, false,
    "Apartamento grande, trabalho híbrido, disponível para acompanhamento."],
  ["Marcos Vieira", "marcos.v@exemplo.com", "21911110000", "São Gonçalo", "CASA", false, false,
    "Casa sem muro, mas o cachorro ficaria dentro."]
];

const EVENTOS_DE_ROTINA = [
  ["VACINA", "V10, primeira dose"],
  ["VACINA", "Antirrábica"],
  ["VERMIFUGO", "Vermifugação de rotina"],
  ["CONSULTA", "Consulta veterinária de rotina"],
  ["CASTRACAO", "Castração realizada no mutirão"]
];

async function chamar(caminho, { metodo = "GET", corpo, token } = {}) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${ENDERECO}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    throw new Error(`${metodo} ${caminho} devolveu ${resposta.status}: ${dados?.detail ?? texto}`);
  }
  return dados;
}

/** Tira acento para casar "Pérola" do elenco com um "Perola" gravado antes. */
function chave(nome) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function enviarFotos(token) {
  const pagina = await chamar("/api/v1/painel/animais?size=100", { token });
  const porNome = new Map(Object.entries(FOTOS).map(([nome, foto]) => [chave(nome), foto]));
  let enviadas = 0;

  for (const animal of pagina.itens) {
    const foto = porNome.get(chave(animal.nome));
    if (!foto || animal.foto) continue;

    const original = await fetch(foto.arquivo, { headers: { "User-Agent": AGENTE } });
    if (!original.ok) {
      console.log(`foto de ${animal.nome} não baixou (${original.status}), segue sem`);
      continue;
    }

    const formulario = new FormData();
    formulario.append("arquivo", new Blob([await original.arrayBuffer()], { type: "image/jpeg" }), `${chave(animal.nome)}.jpg`);
    const credito = new URLSearchParams({ autor: foto.autor, licenca: foto.licenca, fonte: foto.fonte });
    const resposta = await fetch(`${ENDERECO}/api/v1/animais/${animal.id}/foto?${credito}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formulario
    });
    if (!resposta.ok) {
      throw new Error(`foto de ${animal.nome} devolveu ${resposta.status}: ${await resposta.text()}`);
    }
    enviadas += 1;
    // o Commons pede calma com quem baixa em sequência
    await new Promise((pronto) => setTimeout(pronto, 300));
  }

  console.log(`${enviadas} fotos enviadas`);
}

async function principal() {
  try {
    await chamar("/api/v1/autenticacao/registro", { metodo: "POST", corpo: CONTA });
    console.log(`abrigo ${CONTA.email} criado`);
  } catch (erro) {
    if (!String(erro.message).includes("409")) throw erro;
    console.log(`abrigo ${CONTA.email} já existia`);
  }

  const { token } = await chamar("/api/v1/autenticacao/login", {
    metodo: "POST",
    corpo: { email: CONTA.email, senha: CONTA.senha }
  });

  const jaTem = await chamar("/api/v1/painel/animais?size=1", { token });
  if (jaTem.totalDeItens >= ELENCO.length) {
    console.log(`abrigo já tem ${jaTem.totalDeItens} animais, só completa as fotos`);
    await enviarFotos(token);
    return;
  }

  const criados = [];

  for (const [nome, especie, raca, sexo, porte, meses, gramas, diasNoAbrigo, tracos, historia,
               desfecho] of ELENCO) {
    const nascimento = new Date(HOJE);
    nascimento.setMonth(nascimento.getMonth() - meses);

    const animal = await chamar("/api/v1/animais", {
      metodo: "POST",
      token,
      corpo: {
        nome,
        especie,
        raca,
        sexo,
        porte,
        nascimentoEstimado: nascimento.toISOString().slice(0, 10),
        pesoEmGramas: gramas,
        dataDeEntrada: diasAtras(diasNoAbrigo),
        historia,
        castrado: meses > 8,
        vacinado: diasNoAbrigo > 30,
        vermifugado: diasNoAbrigo > 20,
        temperamentos: tracos
      }
    });

    // dois ou três cuidados de rotina por animal, espalhados no período de abrigo
    const quantos = 2 + (animal.id % 2);
    for (let indice = 0; indice < quantos; indice += 1) {
      const [tipo, descricao] = EVENTOS_DE_ROTINA[(animal.id + indice) % EVENTOS_DE_ROTINA.length];
      await chamar(`/api/v1/animais/${animal.id}/eventos`, {
        metodo: "POST",
        token,
        corpo: {
          tipo,
          descricao,
          acontecido: diasAtras(Math.max(1, diasNoAbrigo - (indice + 1) * 12))
        }
      });
    }

    criados.push({ animal, desfecho });
  }

  console.log(`${criados.length} animais cadastrados`);

  let candidato = 0;
  let adocoes = 0;
  let emProcesso = 0;

  for (const { animal, desfecho } of criados) {
    if (desfecho === "disponivel" && animal.id % 3 !== 0) {
      continue;
    }

    const quantos = desfecho === "disponivel" ? 1 : 2;
    const pedidos = [];

    for (let indice = 0; indice < quantos; indice += 1) {
      const [nome, email, telefone, cidade, moradia, area, outros, mensagem] =
        CANDIDATOS[candidato % CANDIDATOS.length];
      candidato += 1;

      pedidos.push(await chamar(`/api/v1/animais/${animal.id}/candidaturas`, {
        metodo: "POST",
        corpo: {
          nome, email, telefone, cidade, moradia,
          areaProtegida: area, temOutrosAnimais: outros, mensagem
        }
      }));
    }

    if (desfecho === "adotado") {
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/analise`, { metodo: "POST", token });
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/aprovacao`, { metodo: "POST", token });
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/adocao`, { metodo: "POST", token });
      adocoes += 1;
    } else if (desfecho === "processo") {
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/aprovacao`, { metodo: "POST", token });
      emProcesso += 1;
    } else if (animal.id % 6 === 0) {
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/recusa`, {
        metodo: "POST",
        token,
        corpo: { motivo: "A casa ainda não tem cerca, e este animal pula muro." }
      });
    } else if (animal.id % 3 === 0) {
      await chamar(`/api/v1/candidaturas/${pedidos[0].id}/analise`, { metodo: "POST", token });
    }
  }

  await enviarFotos(token);

  const resumo = await chamar("/api/v1/painel/resumo", { token });
  console.log(`${adocoes} adoções concluídas, ${emProcesso} em processo`);
  console.log(`resumo: ${resumo.disponiveis} disponíveis, ${resumo.adotados} adotados, `
    + `${resumo.candidaturasEmAberto} pedidos em aberto`);
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
