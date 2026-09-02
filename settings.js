/* ============================================================
   Preferências e recordes, persistidos em localStorage.
   Sem dependências: é o primeiro script a carregar.
   ============================================================ */

const DIFFICULTIES = {
  facil: {
    label: "FÁCIL",
    invaderSpeed: 1.9,
    dropStep: 20,
    shotEvery: 150,
    shotSpeed: 4.5,
    spawnMin: 620,
    spawnVar: 500,
    maxShots: 4,
    fireDelay: 170,
  },
  normal: {
    label: "NORMAL",
    invaderSpeed: 2.6,
    dropStep: 26,
    shotEvery: 100,
    shotSpeed: 6,
    spawnMin: 500,
    spawnVar: 500,
    maxShots: 3,
    fireDelay: 200,
  },
  dificil: {
    label: "BRUTAL",
    invaderSpeed: 3.5,
    dropStep: 34,
    shotEvery: 64,
    shotSpeed: 7.5,
    spawnMin: 380,
    spawnVar: 360,
    maxShots: 3,
    fireDelay: 230,
  },
};

/* Cada opção vira uma linha do painel de ajustes. `scope` decide em que
   plataforma ela aparece: mostrar "vibração" no desktop seria ruído. */
const OPTIONS = [
  {
    key: "difficulty",
    label: "DIFICULDADE",
    scope: "all",
    values: ["facil", "normal", "dificil"],
    format: (value) => DIFFICULTIES[value].label,
  },
  {
    key: "sfx",
    label: "EFEITOS",
    scope: "all",
    values: [true, false],
    format: (value) => (value ? "LIGADO" : "DESLIGADO"),
  },
  {
    key: "music",
    label: "TRILHA",
    scope: "all",
    values: [true, false],
    format: (value) => (value ? "LIGADA" : "DESLIGADA"),
  },
  {
    key: "volume",
    label: "VOLUME",
    scope: "all",
    values: [0, 20, 40, 60, 80, 100],
    format: (value) => "#".repeat(value / 20) + "-".repeat(5 - value / 20),
  },
  {
    key: "hand",
    label: "CONTROLES",
    scope: "touch",
    values: ["destro", "canhoto"],
    format: (value) => (value === "destro" ? "DESTRO" : "CANHOTO"),
  },
  {
    key: "haptics",
    label: "VIBRAR",
    scope: "touch",
    values: [true, false],
    format: (value) => (value ? "LIGADO" : "DESLIGADO"),
  },
  {
    key: "crt",
    label: "EFEITO CRT",
    scope: "desktop",
    values: [true, false],
    format: (value) => (value ? "LIGADO" : "DESLIGADO"),
  },
];

const Settings = {
  STORAGE_KEY: "invaders.settings",
  BEST_KEY: "invaders.best",

  values: {
    difficulty: "normal",
    sfx: true,
    music: true,
    volume: 60,
    hand: "destro",
    haptics: true,
    crt: true,
  },

  bests: { facil: 0, normal: 0, dificil: 0 },

  listeners: [],

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
      for (const key of Object.keys(this.values)) {
        if (saved[key] !== undefined) this.values[key] = saved[key];
      }
      const bests = JSON.parse(localStorage.getItem(this.BEST_KEY) || "null");
      if (bests && typeof bests === "object") {
        Object.assign(this.bests, bests);
      } else if (bests !== null) {
        // recorde antigo era um número solto, antes de existir dificuldade
        this.bests.normal = Number(bests) || 0;
      }
    } catch (error) {
      // localStorage bloqueado (modo privado, iframe): segue nos padrões
    }
    return this;
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.values));
      localStorage.setItem(this.BEST_KEY, JSON.stringify(this.bests));
    } catch (error) {
      /* sem persistência, mas a sessão continua válida */
    }
  },

  get(key) {
    return this.values[key];
  },

  set(key, value) {
    if (this.values[key] === value) return value;
    this.values[key] = value;
    this.save();
    this.listeners.forEach((fn) => fn(key, value));
    return value;
  },

  /* avança (ou volta) na lista de valores possíveis daquela opção */
  cycle(key, direction) {
    const option = OPTIONS.find((item) => item.key === key);
    if (!option) return;
    const current = option.values.indexOf(this.values[key]);
    const next =
      (current + direction + option.values.length) % option.values.length;
    return this.set(key, option.values[next]);
  },

  onChange(fn) {
    this.listeners.push(fn);
  },

  difficulty() {
    return DIFFICULTIES[this.values.difficulty] || DIFFICULTIES.normal;
  },

  best(key = this.values.difficulty) {
    return this.bests[key] || 0;
  },

  recordScore(score) {
    const key = this.values.difficulty;
    if (score <= this.best(key)) return false;
    this.bests[key] = score;
    this.save();
    return true;
  },

  resetBests() {
    this.bests = { facil: 0, normal: 0, dificil: 0 };
    this.save();
  },

  /* opções válidas para a plataforma atual */
  visibleOptions(isTouch) {
    return OPTIONS.filter(
      (option) =>
        option.scope === "all" ||
        (option.scope === "touch") === Boolean(isTouch)
    );
  },
};

Settings.load();
