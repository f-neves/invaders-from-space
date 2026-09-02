# Invaders from Space

**[Jogar agora](https://f-neves.github.io/invaders-from-space/)** · publicado pelo GitHub Pages a partir do `main`.

Shoot'em up vertical em Canvas 2D, sem dependências e sem build. É só servir a
pasta por HTTP.

```bash
python -m http.server 8000
# http://localhost:8000
```

## Arquivos

Os scripts carregam nesta ordem, cada um dependendo só dos anteriores:

| arquivo       | papel                                                          |
| ------------- | -------------------------------------------------------------- |
| `settings.js` | preferências, presets de dificuldade e recordes em localStorage |
| `audio.js`    | pool de vozes por efeito, trilha em loop, vibração              |
| `menu.js`     | painéis de menu, opções, recordes, pausa e fim                  |
| `space.js`    | o jogo: escala de tela, entidades, máquina de estados, loop     |
| `index.html`  | HUD, tela e doca de controles                                   |
| `style.css`   | apresentação, com os dois modos `[data-mode]`                   |

`settings.js` e `audio.js` não conhecem o jogo. `menu.js` só mexe em interface e
recebe os callbacks em `UI.init()`. `space.js` é quem amarra tudo.

## Como a tela funciona

O jogo raciocina sempre numa **resolução lógica fixa de 400x660**. Nada no código
de jogo lê o tamanho real da janela: quem faz a ponte é `resizeScreen()`, que

1. mede o espaço disponível (diferente em cada modo),
2. escolhe um fator de escala que caiba nele,
3. dimensiona o elemento `#screen` em pixels CSS,
4. cria o buffer do canvas em pixels **físicos** (`escala x devicePixelRatio`,
   limitado a 2x) e aplica `setTransform`.

O resultado é que a mesma partida roda igual em qualquer tela e os sprites
continuam nítidos, sem interpolação (`imageSmoothingEnabled = false`).

## Os dois modos

O modo é decidido por `matchMedia('(hover: none) and (pointer: coarse)')` e
gravado em `document.body.dataset.mode`. Ele é reavaliado quando o navegador
muda de ideia (tablet que ganha teclado, por exemplo).

**`desktop`** · gabinete de arcade centralizado: moldura com brilho, barra de HUD
acima da tela, linhas de varredura e vinheta sobre o canvas, e as teclas
indicadas embaixo. Nenhum botão de toque existe na página.

**`touch`** · o jogo ocupa toda a área acima da doca. O HUD flutua sobre o topo,
respeitando `safe-area-inset-top`, e os invasores nascem abaixo dele (`topInset`).
A doca fica na base com `safe-area-inset-bottom`: direcional, pausa e tiro.

## Estados

`menu` → `playing` ⇄ `paused` → `over` → `menu`. O estado atual vai para
`body[data-state]`, que o CSS usa para esconder o HUD no menu e desativar a doca
fora da partida.

No `menu` o loop continua rodando em modo atrativo: os invasores desfilam ao
fundo do painel, sem nave e sem colisão. No `paused` o loop desenha o quadro
congelado sem avançar nada.

## Opções

Cada linha do painel vem da lista `OPTIONS` em `settings.js`, com um `scope` que
decide em qual plataforma ela aparece. Clicar avança o valor; com a linha em
foco, as setas mudam para os dois lados.

| opção        | onde     | efeito                                              |
| ------------ | -------- | --------------------------------------------------- |
| DIFICULDADE  | ambos    | velocidade, cadência de tiro e frequência dos grids |
| EFEITOS      | ambos    | sons de tiro, explosão e menu                       |
| TRILHA       | ambos    | música de fundo em loop                             |
| VOLUME       | ambos    | volume mestre, em seis passos                       |
| CONTROLES    | celular  | destro ou canhoto, espelha a doca inteira           |
| VIBRAR       | celular  | retorno tátil ao acertar e ao morrer                |
| EFEITO CRT   | desktop  | linhas de varredura e vinheta                       |

Os recordes são guardados **por dificuldade**. O formato antigo (um número solto)
é migrado para o recorde do NORMAL na primeira carga.

## Controles

- Teclado: `A`/`D` ou setas para mover, `ESPAÇO` para atirar (segurar repete),
  `ESC` para pausar. Nos menus: setas navegam, `ENTER` confirma, `ESC` volta.
- Toque: botões da doca, com `pointer events` e captura de ponteiro. Um toque
  curto dispara na hora, sem depender do frame seguinte.

## Uma nota sobre a fonte

A Press Start 2P desenha **Ú** e **Í** com altura de minúscula e come o til do
**Ã**. Já **Á**, **É**, **Ó**, **Ç** e **Õ** saem certos. Os blocos `▮▯` e as
setas `◀▶` não existem na fonte e caem em fonte de sistema. Por isso os textos de
tela evitam essas três letras e usam ASCII nas barras e setas. Vale lembrar disso
antes de escrever qualquer rótulo novo.

## Estado atual

Feito: adaptação mobile/web, HUD por plataforma, menu inicial com opções e
recordes, pausa, máquina de estados, áudio completo, dificuldade em três níveis,
colisão invasor x nave e derrota por invasão.

O que vem depois está em **[`MELHORIAS.md`](MELHORIAS.md)**, com a ordem
recomendada, o porquê de cada item e onde mexer. Começa por delta time no loop,
já que hoje o jogo roda mais rápido em monitor de 144 Hz.
