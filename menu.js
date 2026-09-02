/* ============================================================
   Navegação dos painéis: menu, opções, recordes, pausa e fim.
   Só cuida de interface. Quem manda no jogo é o space.js, que
   registra os callbacks em UI.init().
   Depende de settings.js e audio.js.
   ============================================================ */

const UI = {
  panel: document.querySelector("#panel"),
  optionList: document.querySelector("#optionList"),
  scoreTable: document.querySelector("#scoreTable"),

  menuDifficulty: document.querySelector("#menuDifficulty"),
  menuBest: document.querySelector("#menuBest"),
  overScore: document.querySelector("#overScore"),
  overBest: document.querySelector("#overBest"),
  overBadge: document.querySelector("#overBadge"),

  view: "menu",
  optionsReturn: "menu",
  actions: {},
  isTouch: false,

  pad: (value) => String(value).padStart(5, "0"),

  init(actions) {
    this.actions = actions;
    this.buildOptions();
    this.panel.addEventListener("click", (event) => this.onClick(event));
    window.addEventListener("keydown", (event) => this.onKeyDown(event), true);
    Settings.onChange((key) => this.onSettingChange(key));
    this.applyBodyFlags();
    return this;
  },

  /* o conjunto de opções muda entre desktop e celular */
  setTouch(isTouch) {
    if (this.isTouch === isTouch && this.optionList.children.length) return;
    this.isTouch = isTouch;
    this.buildOptions();
  },

  /* ---------- construção das telas ---------- */

  buildOptions() {
    this.optionList.textContent = "";
    for (const option of Settings.visibleOptions(this.isTouch)) {
      const row = document.createElement("button");
      row.className = "option";
      row.type = "button";
      row.dataset.nav = "";
      row.dataset.option = option.key;

      const label = document.createElement("span");
      label.className = "option-label";
      label.textContent = option.label;

      const value = document.createElement("span");
      value.className = "option-value";
      value.dataset.value = option.key;
      value.textContent = option.format(Settings.get(option.key));

      row.append(label, value);
      this.optionList.append(row);
    }
  },

  refreshOptionValues() {
    for (const option of Settings.visibleOptions(this.isTouch)) {
      const cell = this.optionList.querySelector(
        `[data-value="${option.key}"]`
      );
      if (cell) cell.textContent = option.format(Settings.get(option.key));
    }
  },

  buildScores() {
    this.scoreTable.textContent = "";
    for (const [key, preset] of Object.entries(DIFFICULTIES)) {
      const row = document.createElement("li");
      row.className = "score-row";
      if (key === Settings.get("difficulty")) row.classList.add("is-current");

      const name = document.createElement("span");
      name.textContent = preset.label;
      const value = document.createElement("span");
      value.className = "score-value";
      value.textContent = this.pad(Settings.best(key));

      row.append(name, value);
      this.scoreTable.append(row);
    }
  },

  refreshMenu() {
    this.menuDifficulty.textContent = Settings.difficulty().label;
    this.menuBest.textContent = this.pad(Settings.best());
  },

  /* ---------- troca de tela ---------- */

  show(view) {
    this.view = view;
    this.panel.dataset.view = view;
    this.panel.classList.add("is-open");
    document.body.classList.add("is-paneled");

    if (view === "menu") this.refreshMenu();
    if (view === "options") this.refreshOptionValues();
    if (view === "scores") this.buildScores();

    this.focusFirst();
  },

  hide() {
    this.panel.classList.remove("is-open");
    document.body.classList.remove("is-paneled");
    const focused = document.activeElement;
    if (focused && this.panel.contains(focused)) focused.blur();
  },

  showOver({ score, best, isRecord }) {
    this.overScore.textContent = this.pad(score);
    this.overBest.textContent = this.pad(best);
    this.overBadge.hidden = !isRecord;
    this.show("over");
  },

  /* ---------- navegação ---------- */

  items() {
    const screen = this.panel.querySelector(`[data-screen="${this.view}"]`);
    return screen ? Array.from(screen.querySelectorAll("[data-nav]")) : [];
  },

  focusFirst() {
    const items = this.items();
    if (items.length) items[0].focus();
  },

  moveFocus(step) {
    const items = this.items();
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    const next = (current + step + items.length) % items.length;
    items[next].focus();
    Sound.play("select");
  },

  onClick(event) {
    const row = event.target.closest("[data-option]");
    if (row) {
      this.changeOption(row.dataset.option, 1);
      return;
    }
    const button = event.target.closest("[data-action]");
    if (button) this.run(button.dataset.action);
  },

  changeOption(key, direction) {
    Settings.cycle(key, direction);
    this.refreshOptionValues();
    Sound.play("select");
  },

  run(action) {
    Sound.play(action === "play" ? "start" : "select");

    switch (action) {
      case "play":
        this.hide();
        this.actions.onPlay();
        break;
      case "options":
        this.optionsReturn = this.view;
        this.show("options");
        break;
      case "scores":
        this.show("scores");
        break;
      case "reset":
        Settings.resetBests();
        this.buildScores();
        break;
      case "resume":
        this.hide();
        this.actions.onResume();
        break;
      case "quit":
        this.actions.onQuit();
        this.show("menu");
        break;
      case "back":
        this.show(this.view === "options" ? this.optionsReturn : "menu");
        break;
    }
  },

  onKeyDown(event) {
    if (!this.panel.classList.contains("is-open")) return;

    const focused = document.activeElement;
    const onOption = focused && focused.dataset && focused.dataset.option;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.moveFocus(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.moveFocus(1);
        break;
      case "ArrowLeft":
        if (!onOption) return;
        event.preventDefault();
        this.changeOption(focused.dataset.option, -1);
        break;
      case "ArrowRight":
        if (!onOption) return;
        event.preventDefault();
        this.changeOption(focused.dataset.option, 1);
        break;
      case "Escape":
        event.preventDefault();
        if (this.view === "options") this.run("back");
        else if (this.view === "scores") this.run("back");
        else if (this.view === "pause") this.run("resume");
        break;
      default:
        return;
    }
    // impede que o jogo veja a mesma tecla
    event.stopPropagation();
  },

  /* ---------- reflexos das preferências no documento ---------- */

  applyBodyFlags() {
    document.body.classList.toggle("no-crt", !Settings.get("crt"));
    document.body.classList.toggle("lefty", Settings.get("hand") === "canhoto");
  },

  onSettingChange(key) {
    if (key === "crt" || key === "hand") this.applyBodyFlags();
    if (key === "difficulty") this.refreshMenu();
    if (this.actions.onSettingChange) this.actions.onSettingChange(key);
  },
};
