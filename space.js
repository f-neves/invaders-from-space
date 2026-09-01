/* ============================================================
   Invaders from Space
   Resolução lógica fixa: o jogo sempre raciocina em 400x660.
   A camada de tela só escala esse retângulo para o espaço
   disponível, respeitando o devicePixelRatio.
   ============================================================ */

const GAME_W = 400;
const GAME_H = 660;

const canvas = document.querySelector("#game");
const c = canvas.getContext("2d");

const appEl = document.querySelector("#app");
const stageEl = document.querySelector("#stage");
const screenEl = document.querySelector("#screen");
const hudEl = document.querySelector("#hud");
const hintsEl = document.querySelector("#hints");
const dockEl = document.querySelector("#dock");

const scoreEl = document.querySelector("#scoreEl");
const bestEl = document.querySelector("#bestEl");
const overlayEl = document.querySelector("#overlay");
const overlayScoreEl = document.querySelector("#overlayScore");
const overlayBestEl = document.querySelector("#overlayBest");
const restartEl = document.querySelector("#restart");

const buttonLeft = document.querySelector("#buttonLeft");
const buttonRight = document.querySelector("#buttonRight");
const buttonAttack = document.querySelector("#buttonAttack");

/* ---------- constantes de arte ---------- */

const SPRITE_SCALE = 0.6;
const INVADER_W = 44 * SPRITE_SCALE;
const INVADER_H = 32 * SPRITE_SCALE;
const CELL_W = (44 + 10) * SPRITE_SCALE;
const CELL_H = (32 + 5) * SPRITE_SCALE;
const PLAYER_W = 50;
const PLAYER_H = 48;

/* ============================================================
   1. Modo de entrada e escala de tela
   ============================================================ */

const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)");
let isTouch = coarsePointer.matches;

// altura do HUD convertida para unidades logicas: no mobile ele flutua
// sobre o jogo, entao os invasores precisam nascer abaixo dele
let topInset = 0;

function applyMode() {
  document.body.dataset.mode = isTouch ? "touch" : "desktop";
}

function resizeScreen() {
  let availW;
  let availH;

  if (isTouch) {
    // a doca ocupa a base; o HUD flutua sobre o jogo e não rouba espaço
    availW = appEl.clientWidth;
    availH = appEl.clientHeight - dockEl.offsetHeight;
  } else {
    // o gabinete precisa caber com HUD em cima e dicas embaixo
    const chrome = hudEl.offsetHeight + hintsEl.offsetHeight + 96;
    availW = Math.min(window.innerWidth - 64, 640);
    availH = window.innerHeight - chrome;
  }

  const fit = Math.max(
    0.2,
    Math.min(availW / GAME_W, availH / GAME_H, isTouch ? 4 : 2.2)
  );

  const cssW = Math.round(GAME_W * fit);
  const cssH = Math.round(GAME_H * fit);

  screenEl.style.width = cssW + "px";
  screenEl.style.height = cssH + "px";

  // buffer do canvas em pixels físicos: nada de sprite borrado
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const render = Math.min(fit * dpr, 4);
  canvas.width = Math.round(GAME_W * render);
  canvas.height = Math.round(GAME_H * render);
  c.setTransform(render, 0, 0, render, 0, 0);
  c.imageSmoothingEnabled = false;

  topInset = isTouch ? Math.round(hudEl.offsetHeight / fit) : 0;
}

function refreshLayout() {
  applyMode();
  resizeScreen();
}

coarsePointer.addEventListener("change", (event) => {
  isTouch = event.matches;
  refreshLayout();
});

window.addEventListener("resize", resizeScreen);
window.addEventListener("orientationchange", () =>
  requestAnimationFrame(resizeScreen)
);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeScreen);
}

applyMode();
resizeScreen();
// a fonte muda a altura do HUD depois de carregar
if (document.fonts) document.fonts.ready.then(resizeScreen);

/* ============================================================
   2. Áudio
   ============================================================ */

const laserPool = Array.from({ length: 6 }, () => {
  const audio = new Audio("audio/laser.wav");
  audio.volume = 0.14;
  return audio;
});
let laserIndex = 0;

function playLaser() {
  const audio = laserPool[laserIndex];
  laserIndex = (laserIndex + 1) % laserPool.length;
  audio.currentTime = 0;
  const played = audio.play();
  if (played) played.catch(() => {});
}

/* ============================================================
   3. Entidades
   ============================================================ */

class Player {
  constructor() {
    this.width = PLAYER_W;
    this.height = PLAYER_H;
    this.velocity = { x: 0, y: 0 };
    this.opacity = 1;
    this.image = null;
    this.position = {
      x: GAME_W / 2 - this.width / 2,
      y: GAME_H - this.height - 28,
    };

    const image = new Image();
    image.src = "./img/player.png";
    image.onload = () => {
      this.image = image;
    };
  }

  draw() {
    if (!this.image) return;
    c.save();
    c.globalAlpha = this.opacity;
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
    c.restore();
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.x = Math.max(
      0,
      Math.min(GAME_W - this.width, this.position.x)
    );
    this.draw();
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, Math.PI, 0);
    c.fillStyle = "lightyellow";
    c.fill();
    c.closePath();
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.draw();
  }
}

class InvaderProjectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.width = 3;
    this.height = 10;
  }

  draw() {
    c.fillStyle = "#ff4d5e";
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.draw();
  }
}

class Particle {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw() {
    c.save();
    c.globalAlpha = Math.max(0, this.opacity);
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
    c.restore();
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.fades) this.opacity -= 0.012;
    this.draw();
  }
}

class Invader {
  constructor({ position }) {
    // posição e tamanho já no construtor: sem corrida com o onload
    this.position = { x: position.x, y: position.y };
    this.width = INVADER_W;
    this.height = INVADER_H;
    this.image = null;

    const image = new Image();
    image.src = `img/enemy${1 + Math.floor(Math.random() * 3)}.png`;
    image.onload = () => {
      this.image = image;
    };
  }

  draw() {
    if (!this.image) return;
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update(velocity) {
    this.position.x += velocity.x;
    this.position.y += velocity.y;
    this.draw();
  }

  shoot(list) {
    list.push(
      new InvaderProjectile({
        position: {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height,
        },
        velocity: { x: 0, y: 6 },
      })
    );
  }
}

class Grid {
  constructor() {
    const maxColumns = Math.max(3, Math.floor((GAME_W - 24) / CELL_W));
    const columns = Math.min(maxColumns, 4 + Math.floor(Math.random() * 3));
    const rows = 2 + Math.floor(Math.random() * 4);

    this.width = columns * CELL_W;
    this.position = {
      x: Math.random() * Math.max(0, GAME_W - this.width),
      y: topInset,
    };
    this.velocity = { x: 2.6, y: 0 };
    this.invaders = [];

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        this.invaders.push(
          new Invader({
            position: {
              x: this.position.x + i * CELL_W,
              y: this.position.y + j * CELL_H,
            },
          })
        );
      }
    }
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y = 0;

    const right = this.position.x + this.width;
    if (right >= GAME_W || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x;
      this.velocity.y = 26;
    }
  }

  // recalcula os limites reais depois de perder invasores
  refreshBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const invader of this.invaders) {
      minX = Math.min(minX, invader.position.x);
      maxX = Math.max(maxX, invader.position.x + invader.width);
    }
    this.position.x = minX;
    this.width = maxX - minX;
  }
}

/* ============================================================
   4. Estado
   ============================================================ */

const player = new Player();
const projectiles = [];
const invaderProjectiles = [];
const particles = [];
const grids = [];

const keys = {
  left: { pressed: false },
  right: { pressed: false },
  fire: { pressed: false },
};

const game = { over: false, active: true };

let frames = 0;
let randomInterval = 500 + Math.floor(Math.random() * 500);
let score = 0;
let best = Number(localStorage.getItem("invaders.best") || 0);

const pad = (value) => String(value).padStart(5, "0");

function renderScore() {
  scoreEl.textContent = pad(score);
  bestEl.textContent = pad(best);
}
renderScore();

/* ---------- estrelas de fundo ---------- */

for (let i = 0; i < 80; i++) {
  particles.push(
    new Particle({
      position: { x: Math.random() * GAME_W, y: Math.random() * GAME_H },
      velocity: { x: 0, y: 0.15 + Math.random() * 0.3 },
      radius: Math.random() * 1.8,
      color: "white",
    })
  );
}

function createParticles({ object, fades, color }) {
  for (let i = 0; i < 12; i++) {
    particles.push(
      new Particle({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2,
        },
        velocity: {
          x: (Math.random() - 0.5) * 2.4,
          y: (Math.random() - 0.5) * 2.4,
        },
        radius: 3 * Math.random(),
        color: color || "#baa0de",
        fades,
      })
    );
  }
}

/* ============================================================
   5. Tiro do jogador
   ============================================================ */

const FIRE_DELAY = 200;
const MAX_PROJECTILES = 3;
let lastFiredAt = 0;

function fireProjectile() {
  if (game.over || !player.image) return;

  const now = performance.now();
  if (now - lastFiredAt < FIRE_DELAY) return;
  if (projectiles.length >= MAX_PROJECTILES) return;

  projectiles.push(
    new Projectile({
      position: {
        x: player.position.x + player.width / 2,
        y: player.position.y,
      },
      velocity: { x: 0, y: -7 },
    })
  );
  lastFiredAt = now;
  playLaser();
}

/* ============================================================
   6. Fim de jogo
   ============================================================ */

function endGame() {
  if (game.over) return;
  game.over = true;
  player.opacity = 0;

  createParticles({ object: player, color: "grey", fades: true });

  if (score > best) {
    best = score;
    localStorage.setItem("invaders.best", String(best));
    renderScore();
  }

  setTimeout(() => {
    game.active = false;
    document.body.classList.add("is-over");
    overlayScoreEl.textContent = pad(score);
    overlayBestEl.textContent = pad(best);
    overlayEl.classList.add("is-open");
    restartEl.focus();
  }, 1200);
}

function restart() {
  window.location.reload();
}

restartEl.addEventListener("click", restart);

/* ============================================================
   7. Colisões
   ============================================================ */

function hitsPlayer(projectile) {
  return (
    projectile.position.y + projectile.height >= player.position.y &&
    projectile.position.y <= player.position.y + player.height &&
    projectile.position.x + projectile.width >= player.position.x &&
    projectile.position.x <= player.position.x + player.width
  );
}

function hitsInvader(projectile, invader) {
  return (
    projectile.position.y - projectile.radius <=
      invader.position.y + invader.height &&
    projectile.position.y + projectile.radius >= invader.position.y &&
    projectile.position.x + projectile.radius >= invader.position.x &&
    projectile.position.x - projectile.radius <=
      invader.position.x + invader.width
  );
}

/* ============================================================
   8. Loop
   ============================================================ */

function animate() {
  if (!game.active) return;
  requestAnimationFrame(animate);

  c.fillStyle = "black";
  c.fillRect(0, 0, GAME_W, GAME_H);

  // estrelas e explosões
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    if (particle.opacity <= 0) {
      particles.splice(i, 1);
      continue;
    }
    if (particle.position.y - particle.radius >= GAME_H) {
      particle.position.x = Math.random() * GAME_W;
      particle.position.y = -particle.radius;
    }
    particle.update();
  }

  player.update();

  // tiros inimigos
  for (let i = invaderProjectiles.length - 1; i >= 0; i--) {
    const shot = invaderProjectiles[i];
    if (shot.position.y >= GAME_H) {
      invaderProjectiles.splice(i, 1);
      continue;
    }
    shot.update();
    if (!game.over && hitsPlayer(shot)) {
      invaderProjectiles.splice(i, 1);
      endGame();
    }
  }

  // tiros do jogador
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const shot = projectiles[i];
    if (shot.position.y + shot.radius <= 0) {
      projectiles.splice(i, 1);
      continue;
    }
    shot.update();
  }

  // grids de invasores
  for (let g = grids.length - 1; g >= 0; g--) {
    const grid = grids[g];
    grid.update();

    if (frames % 100 === 0 && grid.invaders.length > 0) {
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(
        invaderProjectiles
      );
    }

    let lostInvader = false;

    for (let i = grid.invaders.length - 1; i >= 0; i--) {
      const invader = grid.invaders[i];
      invader.update(grid.velocity);

      for (let j = projectiles.length - 1; j >= 0; j--) {
        if (!hitsInvader(projectiles[j], invader)) continue;
        projectiles.splice(j, 1);
        grid.invaders.splice(i, 1);
        lostInvader = true;
        score += 10;
        renderScore();
        createParticles({ object: invader, fades: true });
        break;
      }
    }

    if (grid.invaders.length === 0) {
      grids.splice(g, 1);
    } else if (lostInvader) {
      grid.refreshBounds();
    }
  }

  // movimento do jogador
  if (!game.over && keys.left.pressed) {
    player.velocity.x = -8;
  } else if (!game.over && keys.right.pressed) {
    player.velocity.x = 8;
  } else {
    player.velocity.x = 0;
  }

  if (keys.fire.pressed) fireProjectile();

  if (frames % randomInterval === 0) {
    grids.push(new Grid());
    randomInterval = 500 + Math.floor(Math.random() * 500);
    frames = 0;
  }
  frames++;
}

animate();

/* ============================================================
   9. Entrada: teclado (web) e toque (mobile)
   ============================================================ */

const KEY_MAP = {
  a: "left",
  A: "left",
  ArrowLeft: "left",
  d: "right",
  D: "right",
  ArrowRight: "right",
  " ": "fire",
};

window.addEventListener("keydown", (event) => {
  if (game.over) {
    // se o botão está com foco ele já responde a Enter sozinho
    const buttonHasFocus = document.activeElement === restartEl;
    if ((event.key === "Enter" || event.key === " ") && !buttonHasFocus) {
      event.preventDefault();
      restart();
    }
    return;
  }
  const action = KEY_MAP[event.key];
  if (!action) return;
  event.preventDefault();
  if (event.repeat) return;
  keys[action].pressed = true;
  // dispara já no toque: um clique curto não pode passar em branco
  if (action === "fire") fireProjectile();
});

window.addEventListener("keyup", (event) => {
  const action = KEY_MAP[event.key];
  if (!action) return;
  keys[action].pressed = false;
});

// o navegador perde o keyup se a aba sai de foco
window.addEventListener("blur", () => {
  keys.left.pressed = false;
  keys.right.pressed = false;
  keys.fire.pressed = false;
});

/* ---------- botões touch ---------- */

function bindHold(element, action) {
  const press = (event) => {
    event.preventDefault();
    if (game.over) return;
    keys[action].pressed = true;
    element.classList.add("is-down");
    // um toque curto pode começar e terminar dentro do mesmo frame
    if (action === "fire") fireProjectile();
    if (element.setPointerCapture && event.pointerId !== undefined) {
      try {
        element.setPointerCapture(event.pointerId);
      } catch (error) {
        /* alguns navegadores recusam a captura, seguimos sem ela */
      }
    }
  };

  const release = (event) => {
    if (event) event.preventDefault();
    keys[action].pressed = false;
    element.classList.remove("is-down");
  };

  element.addEventListener("pointerdown", press);
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("lostpointercapture", release);
  element.addEventListener("contextmenu", (event) => event.preventDefault());
}

bindHold(buttonLeft, "left");
bindHold(buttonRight, "right");
bindHold(buttonAttack, "fire");

// impede o zoom por duplo toque durante a partida
document.addEventListener(
  "dblclick",
  (event) => event.preventDefault(),
  { passive: false }
);
