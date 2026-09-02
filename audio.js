/* ============================================================
   Som: um pool de vozes por efeito, para nunca alocar um Audio
   por disparo, e uma trilha em loop separada.
   Depende de settings.js.
   ============================================================ */

const SOUND_BANK = {
  laser: { src: "audio/laser.wav", gain: 0.35, voices: 4 },
  enemy: { src: "audio/enemyShoot.wav", gain: 0.22, voices: 3 },
  explode: { src: "audio/explode.wav", gain: 0.4, voices: 4 },
  select: { src: "audio/select.mp3", gain: 0.5, voices: 2 },
  start: { src: "audio/start.mp3", gain: 0.6, voices: 1 },
  over: { src: "audio/gameOver.mp3", gain: 0.6, voices: 1 },
};

const Sound = {
  pools: {},
  music: null,
  unlocked: false,
  musicWanted: false,

  init() {
    for (const [name, spec] of Object.entries(SOUND_BANK)) {
      this.pools[name] = {
        spec,
        index: 0,
        voices: Array.from({ length: spec.voices }, () => {
          const audio = new Audio(spec.src);
          audio.preload = "auto";
          return audio;
        }),
      };
    }

    this.music = new Audio("audio/backgroundMusic.mp3");
    this.music.loop = true;
    this.music.preload = "none";

    this.applyVolume();
    Settings.onChange((key) => {
      if (key === "volume" || key === "music" || key === "sfx") {
        this.applyVolume();
      }
    });

    // navegador só libera áudio depois de um gesto do usuário
    const unlock = () => {
      this.unlocked = true;
      if (this.musicWanted) this.startMusic();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    return this;
  },

  masterVolume() {
    return Settings.get("volume") / 100;
  },

  applyVolume() {
    const master = this.masterVolume();
    for (const pool of Object.values(this.pools)) {
      const level = Settings.get("sfx") ? pool.spec.gain * master : 0;
      pool.voices.forEach((voice) => {
        voice.volume = Math.min(1, level);
      });
    }
    if (this.music) this.music.volume = Math.min(1, 0.35 * master);

    if (!Settings.get("music") || master === 0) {
      this.stopMusic();
    } else if (this.musicWanted) {
      this.startMusic();
    }
  },

  play(name) {
    if (!Settings.get("sfx") || this.masterVolume() === 0) return;
    const pool = this.pools[name];
    if (!pool) return;

    const voice = pool.voices[pool.index];
    pool.index = (pool.index + 1) % pool.voices.length;
    try {
      voice.currentTime = 0;
      const played = voice.play();
      if (played) played.catch(() => {});
    } catch (error) {
      /* voz ainda carregando: perder um efeito não quebra o jogo */
    }
  },

  wantMusic(on) {
    this.musicWanted = on;
    if (on) this.startMusic();
    else this.stopMusic();
  },

  startMusic() {
    if (!this.music) return;
    if (!this.unlocked || !Settings.get("music") || this.masterVolume() === 0) {
      return;
    }
    const played = this.music.play();
    if (played) played.catch(() => {});
  },

  stopMusic() {
    if (this.music) this.music.pause();
  },

  vibrate(pattern) {
    if (!Settings.get("haptics")) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  },
};

Sound.init();
