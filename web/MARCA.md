# Guarida

Identidade da interface. Este documento existe para que as decisoes visuais
tenham motivo escrito, e nao virem gosto pessoal na proxima alteracao.

## Nome

**Guarida.** Palavra portuguesa para refugio, abrigo, toca. E o que um abrigo de
animais e, dito com uma palavra que ja existe, sem diminutivo, sem trocadilho
com pata e sem sufixo em ingles. Um animal que chega ali esta na guarida ate
encontrar casa.

Assinatura completa: **Guarida - abrigo e adocao**.
Frase de apoio: *Todo bicho daqui tem nome, ficha e historia.*

## Simbolo

Um arco com uma abertura embaixo: a boca de uma toca vista de frente. O traco
externo e grosso e o vao interno e solido, e essa diferenca de peso e o que
mantem a marca legivel quando ela vira favicon de dezesseis pixels.

Nao e casinha de cachorro com telhado triangular, que e o desenho que todo
petshop usa. E um abrigo em abstrato, que serve para cachorro, gato, coelho e
para o que mais aparecer no portao.

## Cor

| Papel | Nome | Valor |
|---|---|---|
| Primaria | Verde-musgo | `#38503a` |
| Acento | Terracota | `#bc5f38` |
| Documento | Papel osso | `#f6f2ea` |
| Tinta | Grafite quente | `#23201b` |
| Superficie | Branco | `#ffffff` |

Verde-musgo e terracota vem do lugar: mato, barro, telha, corda. A paleta e
quente de proposito, porque o assunto e afeto e nao balanco. O terracota nunca
preenche area grande: ele e etiqueta, fio e numero em destaque.

Situacoes tem cor propria e reservada, que nunca e reaproveitada em outro lugar:
disponivel em verde, em processo em ocre, adotado em azul sereno, indisponivel
em cinza pedra.

## Tipografia

- **Fraunces** nos titulos. Serifa de contraste macio, com um pouco de estranheza
  na terminacao, que da calor sem virar manuscrita.
- **Karla** no texto de interface. Grotesca de formas abertas, boa em tamanho
  pequeno e sem a neutralidade fria das grotescas de banco.
- **Azeret Mono** em id, data, peso e contagem. Monoespacada com desenho
  contemporaneo, para o numero alinhar sem parecer terminal.

## Movimento

1. **Uma vez, com motivo.** A entrada da pagina tem uma sequencia curta; o resto
   so se move quando alguem mexe.
2. **Curta.** Nada acima de 460 ms. Transicao de estado fica em 140 ms.
3. **Silenciavel.** Tudo respeita `prefers-reduced-motion`, inclusive a peca
   tridimensional, que sob essa preferencia so se move quando arrastada.

A plaquinha de coleira e a excecao com razao: ela tem fisica de pendulo, e um
pendulo parado no ar seria mais estranho que um pendulo que balanca. Sob
preferencia por menos movimento ela fica em repouso e continua respondendo ao
arrasto.

## Voz

Frase curta, verbo ativo, sem apelo emocional forcado. O sistema nao diz "ajude
um amiguinho": diz o que faz e quantos animais estao esperando. Erro explica o
que houve e o que fazer, sem pedir desculpa e sem culpar quem esta lendo.
Recusa de candidatura exige motivo escrito, porque recusa sem motivo nao ajuda
ninguem.
