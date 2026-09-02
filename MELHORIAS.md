# Melhorias · Invaders from Space

> **Leia este arquivo antes de propor qualquer plano novo para este jogo.**
> Ele é o backlog acordado. O `README.md` explica a arquitetura; aqui fica o
> que vem pela frente, por quê, e onde mexer.

Levantado em 2026-09-02 a partir de pesquisa sobre game feel, dos clássicos do
gênero (Space Invaders, Galaxian, Galaga) e de práticas de jogo web. As fontes
estão no fim.

**Como usar:** pegar o próximo bloco não marcado da ordem recomendada, confirmar
com o usuário e implementar. Marcar `[x]` ao concluir e commitar a marcação
junto com a mudança.

---

## Estado atual

Feito até aqui: adaptação mobile/web com HUD por plataforma, menu inicial com
opções e recordes, pausa, máquina de estados, áudio completo, dificuldade em
três níveis, colisão invasor x nave e derrota por invasão. Detalhes de
arquitetura no `README.md`.

O jogo está sólido tecnicamente e **fraco como jogo**: não tem arco. Os grids
nascem em intervalos aleatórios, para sempre, na mesma velocidade. A única coisa
que muda ao longo da partida é o número na tela.

---

## Ordem recomendada

- [ ] **Bloco 1 · Fundação:** delta time (item 14), sozinho e antes de tudo.
- [ ] **Bloco 2 · O jogo vira jogo:** escalada de tensão (1), ondas (2), trilha
      acelerando (8). É o bloco de maior impacto por linha de código.
- [ ] **Bloco 3 · Game feel:** tremor (5), hit stop (6), flash e squash (7), com
      o interruptor de acessibilidade (18) nascendo junto.
- [ ] **Bloco 4 · Profundidade:** vidas e vida extra (12), combo (11),
      power-ups (10).

O PWA (16) é independente e pode entrar a qualquer momento.

**Por que o delta time vem primeiro:** todo movimento hoje é em pixels por
frame. Qualquer ajuste de balanceamento feito antes disso vira retrabalho, e o
jogo roda 2,4x mais rápido num monitor de 144 Hz.

---

## A. O buraco estrutural

### 1. Escalada de tensão

- [ ] Fazer a formação acelerar conforme encolhe.

No Space Invaders original, cada alien morto acelera os restantes. Isso nasceu
de limitação de hardware (menos objetos, mais rápido o loop) e virou o coração
do jogo: ele se auto-tensiona. O nosso faz o oposto, matar só esvazia a tela.

**Onde:** `Grid.update()` e `Grid.refreshBounds()` em `space.js`. Guardar
`invadersIniciais` no construtor e escalar `velocity.x` pela razão de vivos.

**Custo:** baixíssimo. **Impacto:** o maior da lista.

### 2. Ondas em vez de spawn aleatório

- [ ] Trocar `nextSpawnInterval()` por uma estrutura de ondas numeradas.

Sem onda não existe "cheguei na fase 5", nem respiro, nem curva de dificuldade.
Dá ao jogador um marco de progresso e a nós um lugar natural para escalar.

**Onde:** `nextSpawnInterval()` e o bloco de spawn no fim de `updatePlay()`.
Precisa de um anúncio de onda na tela e provavelmente de um estado novo entre
ondas na máquina de estados.

### 3. Ataques em mergulho

- [ ] Invasores que rompem a formação e voam contra a nave.

Foi assim que o Galaxian superou o Space Invaders em 1979. O elogio recorrente
ao Galaga é que a formação é sempre a mesma, mas **a ordem em que os inimigos
rompem fileira varia**, e é isso que mantém a ação imprevisível.

**Onde:** `Invader` já tem posição própria e só soma `grid.velocity`. Adicionar
um estado `diving` com uma curva de Bézier e ignorar a velocidade do grid
enquanto mergulha.

### 4. Variedade de formação

- [ ] Duas ou três formas além do retângulo (V, coluna dupla, arco).

Hoje toda formação é um retângulo de 4 a 6 colunas por 2 a 5 linhas.

**Onde:** o loop duplo no construtor de `Grid`. Vira uma tabela de offsets.

---

## B. Game feel

Nada aqui mexe em regra, só na sensação. É a categoria mais barata por unidade
de impacto.

### 5. Screen shake

- [ ] Chutar a câmera no impacto, com decaimento exponencial rápido.

A intensidade precisa **escalar ao evento**: a morte da nave sacode muito mais
que um invasor destruído. Decair rápido para não atrapalhar a leitura.

**Onde:** `animate()` em `space.js` já centraliza a transformação
(`c.setTransform` em `resizeScreen()`). Um `c.translate(shakeX, shakeY)` no topo
do frame resolve.

### 6. Hit stop

- [ ] Congelar 3 a 5 frames (40 a 80 ms) no acerto.

A literatura de game feel é enfática: esse micro-pause vende peso melhor que
qualquer animação. Sem ele, o acerto parece cortar o ar.

**Onde:** um contador que pula o `update` e mantém o `draw`. O estado `paused`
já faz exatamente isso em `drawFrozen()`, dá para reaproveitar o padrão.

### 7. Flash e squash

- [ ] Um frame branco no sprite atingido antes da explosão.
- [ ] Nave comprimindo ao atirar.

"Squash and stretch faz mais pela vivacidade que qualquer outra técnica
isolada."

**Onde:** `Invader.draw()` e `Player.draw()`.

### 8. Trilha que acelera

- [ ] `playbackRate` subindo conforme a onda encolhe.

Ligado ao item 1. No original, o tambor acelerava junto com os aliens porque o
som tocava a cada movimento deles. É o efeito mais icônico do gênero e custa
uma linha.

**Onde:** `Sound.music` em `audio.js`.

### 9. Rastro e clarão

- [ ] Rastro nos projéteis, clarão no cano ao disparar.

Hoje o tiro é um semicírculo amarelo estático.

**Onde:** `Projectile.draw()` e `fireProjectile()`.

---

## C. Loop de recompensa

### 10. Power-ups

- [ ] Tiro duplo, escudo, tiro rápido, caindo de invasores marcados.

`bonus.mp3` e `bomb.mp3` estão parados no repositório esperando exatamente isso.

### 11. Combo e multiplicador

- [ ] Acertos encadeados sem errar valem mais.

Transforma "segurar o botão" numa decisão de mirar.

**Onde:** `updatePlay()`, onde hoje há um `score += 10` fixo.

### 12. Vidas e vida extra por pontuação

- [ ] Três vidas, mais uma vida extra a cada N pontos.

O "extend" é convenção de fliperama e dá uma meta intermediária. Hoje um tiro
encerra tudo, punitivo demais para a sessão curta de celular.

**Onde:** `endRun()` vira "perdeu uma vida" e só encerra no zero. O HUD precisa
de um indicador de vidas, e no celular ele não cabe do jeito que está.

### 13. Fase bônus

- [ ] Uma onda sem risco, só de pontos, a cada 5 ondas.

O Galaga tinha as *challenging stages*, e o consenso é que eram satisfatórias de
um jeito que o Space Invaders não tinha equivalente. Depende do item 2.

### Fora de escopo (decisão tomada)

**Árvore de upgrades tipo roguelite não entra.** O Vampire Survivors funciona
porque a sessão dura 30 minutos e a build cresce dentro dela. A nossa dura 2 a 3
minutos, e enxertar meta-progressão nisso dilui o que o arcade tem de bom.

---

## D. Técnico

### 14. Delta time · **primeiro da fila**

- [ ] Fixed timestep com acumulador.

Simula em passos constantes de 1/60 e renderiza livre, o que dá física
determinística. Todo movimento hoje é em pixels por frame, então o jogo roda
2,4x mais rápido em 144 Hz.

**Onde:** `animate()`. Todos os números de `DIFFICULTIES` em `settings.js`
viram unidades por segundo, e as velocidades de `Player`, `Projectile`,
`InvaderProjectile` e `Particle` junto.

### 15. Pool de objetos

- [ ] Reaproveitar projéteis e partículas em vez de criar e descartar.

Já fizemos isso com o áudio (`Sound.pools`). O mesmo padrão reduz coleta de
lixo, que no celular vira engasgo.

### 16. PWA instalável e offline

- [ ] `manifest.webmanifest` mais service worker.

Para um jogo que se compartilha por link, é o item de plataforma com melhor
retorno: vira ícone na tela inicial e roda sem rede. O projeto inteiro tem
2,3 MB, cabe em cache sem esforço.

### 17. Tela de carregamento

- [ ] Pré-carregar sprites e áudio antes do menu.

Hoje os sprites entram na tela conforme carregam.

---

## E. Acessibilidade

A diretriz da Microsoft (Xbox Accessibility Guideline 117) trata tremor de
câmera explicitamente como barreira. O padrão da indústria é agrupar essas
opções num bloco próprio, não escondido no menu gráfico.

### 18. Interruptor de tremor

- [ ] Nasce junto com o item 5, como opção de escopo `all`.

### 19. Daltonismo

- [ ] Conferir o contraste nos três tipos de daltonismo.

O tiro inimigo é vermelho e o do jogador amarelo claro, sobre preto. A
distinção por **forma** (retângulo contra semicírculo) já existe e é a solução
mais robusta, mas o matiz sozinho não basta.

### 20. Modo de baixo estímulo

- [ ] Reduzir flashes e partículas, para fotossensibilidade.

---

## F. Retenção

### 21. Placar local de 5 posições com iniciais

- [ ] Puro fliperama, encaixa na tela de recordes que já existe.

Muito mais motivador que um número único. Entrada de iniciais precisa funcionar
com teclado e com toque.

### 22. Compartilhar pontuação

- [ ] Botão que copia a pontuação mais o link.

### 23. Desafio diário com semente fixa

- [ ] Mesma sequência de ondas para todo mundo naquele dia.

Barato com um gerador pseudoaleatório semeado pela data, e é um motivo real
para voltar amanhã. Depende do item 2.

---

## Armadilhas conhecidas

**A fonte.** A Press Start 2P desenha **Ú** e **Í** com altura de minúscula e
come o til do **Ã**. Já `Á`, `É`, `Ó`, `Ç` e `Õ` saem certos. Os blocos `▮▯` e
as setas `◀▶` não existem nela e caem em fonte de sistema. Conferir qualquer
rótulo novo antes de commitar. Foi por isso que "MÚSICA" virou "TRILHA",
"VIBRAÇÃO" virou "VIBRAR" e "DIFÍCIL" virou "BRUTAL".

**Estado e interface não podem discordar.** `startRun()` e `resumeRun()` fecham
o painel eles mesmos, justamente porque chamar essas funções por fora da `UI`
deixava o menu aberto sobre a partida.

**Resolução lógica fixa.** Nada no código de jogo pode ler o tamanho da janela.
Tudo raciocina em 400x660 e só `resizeScreen()` faz a ponte.

**Nada de `location.reload()`.** O reinício zera o campo de verdade, via
`resetField()`.

---

## Fontes

Game feel:
- [The "Juice" Factor: Designing Game Feel](https://hackread.com/the-juice-factor-designing-game-feel/)
- [Juice It Good: Adding Camera Shake To Your Game](https://gt3000.medium.com/juice-it-adding-camera-shake-to-your-game-e63e1a16f0a6)
- [Maximizing Game Feel in Action Game Development](https://salivity.github.io/game-development/article/maximizing-game-feel-in-action-game-development)

Os clássicos:
- [Design lessons from Space Invaders · Clive Thompson](https://clivethompson.medium.com/design-lessons-from-space-invaders-5bef75fe8f03)
- [The Secrets of Space Invaders · IEEE Spectrum](https://spectrum.ieee.org/space-invaders)
- [Why Galaxian Works: Comparison with an Attempted Clone](https://www.retrogamedeconstructionzone.com/2020/05/why-galaxian-works-comparison-with.html)
- [Galaxian vs Galaga: How Galaga Improved Galaxian](https://dinogame.gg/blog/galaxian-vs-galaga/)

Design de shmup:
- [Shoot 'em up · Wikipedia](https://en.wikipedia.org/wiki/Shoot_%27em_up)
- [What 10 seconds, procedural generation, and fish do for shoot-'em-up design](https://www.gamedeveloper.com/design/what-10-seconds-procedural-generation-and-fish-do-for-shoot--em-up-design)
- [Vampire Survivors Design Analysis](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)

Técnico:
- [Fixed Timestep Game Loops in the Browser](https://simplified.media/guides/fixed-timestep-loops)
- [A Detailed Explanation of JavaScript Game Loops and Timing · Isaac Sukin](https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing)
- [js13kGames: How to make PWAs installable · MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Installable_PWAs)
- [Progressive Web Games · Mozilla Hacks](https://hacks.mozilla.org/2018/05/progressive-web-games/)

Acessibilidade e UX:
- [Color Blindness Accessibility in Video Games · Filament Games](https://www.filamentgames.com/blog/color-blindness-accessibility-in-video-games)
- [Gaming Accessibility Options: Complete Guide](https://gloobia.com/gaming-accessibility-options/)
- [Best Practices For Mobile Game Onboarding](https://adriancrook.com/best-practices-for-mobile-game-onboarding/)
