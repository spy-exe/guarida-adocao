# Guarida

Identidade da interface. Este documento existe para que as decisões visuais
tenham motivo escrito, e não virem gosto pessoal na próxima alteração.

## Nome

**Guarida.** Palavra portuguesa para refúgio, abrigo, toca. É o que um abrigo de
animais é, dito com uma palavra que já existe, sem diminutivo, sem trocadilho
com pata e sem sufixo em inglês. Um animal que chega ali está na guarida até
encontrar casa.

Assinatura completa: **Guarida, adoção de animais**.

## Símbolo

Um arco com uma abertura embaixo: a boca de uma toca vista de frente. O traço
externo é grosso e o vão interno é sólido, e essa diferença de peso é o que
mantém a marca legível quando ela vira favicon de dezesseis pixels.

Não é casinha de cachorro com telhado triangular, que é o desenho que todo
petshop usa. É um abrigo em abstrato, que serve para cachorro, gato, coelho e
para o que mais aparecer no portão.

## Cor

| Papel | Nome | Valor |
|---|---|---|
| Primária | Verde-musgo | `#2f5d46` |
| Acento | Terracota | `#b85c38` |
| Fundo | Papel | `#f7f4ee` |
| Tinta | Grafite quente | `#1d1b17` |
| Superfície | Branco | `#ffffff` |

Verde-musgo e terracota vêm do lugar: mato, barro, telha, corda. A paleta é
quente de propósito, porque o assunto é afeto e não balanço. O terracota fica
reservado para o que pede cuidado, como recusar um pedido ou excluir um cadastro.

Situações têm cor própria que não é reaproveitada em outro lugar: disponível em
verde, em processo em ocre, adotado em azul sereno, fora da vitrine em cinza
pedra. A cor nunca é a única pista: todo selo tem o nome da situação escrito.

## Tipografia

- **Fraunces** nos títulos e no nome dos animais. Serifa de contraste macio, que
  dá calor sem virar manuscrita.
- **Geist** em todo o resto, inclusive números. Algarismos tabulares alinham
  peso, idade e contagem em coluna sem precisar de fonte monoespaçada.

A primeira versão usava monoespaçada em rótulo, id e data, com caixa alta
espaçada. Saiu de todo lugar: rótulo em fonte de máquina de escrever é o sotaque
mais reconhecível de interface gerada, e ficha de adoção não é terminal.

## Foto e ilustração

A foto é a primeira coisa do cartão e da ficha, porque é por ela que alguém se
interessa por um bicho. Toda foto de terceiro sai com crédito embaixo: autor,
licença e link para a origem.

Sem foto, entra o retrato geométrico da espécie sobre um fundo de matiz próprio.
É desenho assumido, e não imagem de banco fingindo ser o animal.

## Ícones

Lucide, em traço fino e tamanho próximo ao do texto que acompanham. Ícone sempre
vem com palavra ao lado; sozinho, só em botão com rótulo acessível, como o de
sair do painel. Espécie tem ícone próprio (cão, gato, coelho, pássaro), e é ele
que aparece nos filtros e no gráfico de espécies.

## Movimento

1. **Só quando alguém mexe.** Nada entra na tela dançando.
2. **Curto.** Transição de estado em 140 ms, zoom da foto no cartão em 450 ms.
3. **Silenciável.** Tudo respeita `prefers-reduced-motion`, inclusive a peça
   tridimensional, que sob essa preferência só se move quando arrastada.

A plaquinha de coleira é a exceção com razão: ela tem física de pêndulo, e um
pêndulo parado no ar seria mais estranho que um pêndulo que balança.

## Voz

Frase curta, verbo ativo, sem apelo emocional forçado. O sistema não diz "ajude
um amiguinho": diz o que faz e quantos animais estão esperando. Erro explica o
que houve e o que fazer, sem pedir desculpa e sem culpar quem está lendo.
Recusa de pedido exige motivo escrito, porque recusa sem motivo não ajuda
ninguém.
