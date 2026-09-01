# Invaders from Space

Shoot'em up vertical em Canvas 2D, sem dependências e sem build. É só abrir o
`index.html` por um servidor estático.

```bash
python -m http.server 8000
# http://localhost:8000
```

## Arquivos

| arquivo      | papel                                                     |
| ------------ | --------------------------------------------------------- |
| `index.html` | estrutura do HUD, da tela e da doca de controles           |
| `style.css`  | apresentação, com os dois modos `[data-mode]`              |
| `space.js`   | jogo inteiro: escala de tela, entidades, loop e entrada    |
| `img/`       | sprites (nave, três variações de invasor)                  |
| `audio/`     | efeitos                                                    |

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
A doca fica na base com `safe-area-inset-bottom`: direcional à esquerda, tiro à
direita, com estado visual de pressionado.

## Controles

- Teclado: `A`/`D` ou setas para mover, `ESPAÇO` para atirar (segurar repete).
- Toque: botões da doca, com `pointer events` e captura de ponteiro.
- Um toque curto dispara na hora, sem depender do frame seguinte.

## Estado atual

Feito: adaptação mobile/web, HUD por plataforma, recorde em `localStorage`,
tela de game over com reinício.

Próximo: máquina de estados com tela inicial e áudio completo, delta time no
loop, colisão invasor x nave, derrota por invasão, vidas e dificuldade
progressiva.
