# Invaders from Space

**Leia `MELHORIAS.md` antes de propor qualquer plano para este jogo.** É o
backlog acordado, com a ordem recomendada, o porquê de cada item, onde mexer no
código e as armadilhas conhecidas. Não montar um plano novo sem consultá-lo.

`README.md` explica a arquitetura: resolução lógica fixa de 400x660, os dois
modos `[data-mode]`, a máquina de estados e a cascata de scripts
(`settings.js` → `audio.js` → `menu.js` → `space.js`).

## Regras deste projeto

- Nada no código de jogo lê o tamanho da janela. Tudo raciocina em 400x660 e só
  `resizeScreen()` faz a ponte com a tela real.
- A Press Start 2P quebra **Ú**, **Í** e **Ã**, e não tem `▮▯◀▶`. Conferir todo
  rótulo novo de tela antes de commitar.
- Testar as mudanças de interface **nos dois modos** antes de dar por pronto.
  O Playwright está disponível na máquina (`p.devices["iPhone 13"]` cobre bem o
  modo touch) e já pegou bugs reais aqui: toque curto que não disparava, painel
  aberto sobre a partida, glifos que a fonte não desenha.
- Servir por HTTP para testar (`python -m http.server`), não abrir por `file://`.
