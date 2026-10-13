import keyboardSfxUrl from "../../assets/audio/keyboard_sfx.mp3";
import messageNeutralUrl from "../../assets/audio/message_neutral.mp3";
import replySfxUrl from "../../assets/audio/reply_sfx.mp3";

/**
 * AudioManager - Singleton
 * Wrapper para facilitar o acesso aos sons do Phaser e UI Sounds nativos.
 */

class AudioManager {
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    this.scene = null;

    // Configurações globais
    this.globalVolume = 1.0;
    this.muted = false;

    // Web Audio API para sons de UI (resolve problemas de delay em sons curtos e permite overlap)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    this.uiBuffers = {};
    this.activeUiSources = {};

    // Pré-carrega os sons para a memória
    this._loadUI(keyboardSfxUrl, "keyboard_sfx");
    this._loadUI(messageNeutralUrl, "message_neutral");
    this._loadUI(replySfxUrl, "reply_sfx");

    AudioManager.instance = this;
  }

  init(scene) {
    this.scene = scene;
    console.log("[AudioManager] Inicializado com a cena:", scene.scene.key);
  }

  async _loadUI(url, key) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.uiBuffers[key] = audioBuffer;
    } catch (e) {
      console.warn(`[AudioManager] Falha ao decodificar áudio ${key}:`, e);
    }
  }

  play(key, config = {}) {
    if (this.muted) return;

    const vol =
      (config.volume !== undefined ? config.volume : 1) * this.globalVolume;

    // 1) Se for um UI Sound, toca instantaneamente via Web Audio API (sem delay)
    if (this.uiBuffers[key]) {
      // Se o contexto foi suspenso pelo navegador, nós o acordamos
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = this.uiBuffers[key];
      source.loop = !!config.loop;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = vol;

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      source.start(0);

      // Salva referência caso precisemos parar depois (ex: loop de digitação)
      if (!this.activeUiSources[key]) {
        this.activeUiSources[key] = [];
      }
      this.activeUiSources[key].push(source);

      // Limpa a referência da memória quando terminar de tocar
      source.onended = () => {
        const index = this.activeUiSources[key].indexOf(source);
        if (index > -1) {
          this.activeUiSources[key].splice(index, 1);
        }
      };

      return source;
    }

    // 2) Tenta tocar via Phaser
    if (!this.scene) {
      console.warn(
        `[AudioManager] Tentativa de tocar o som Phaser '${key}' sem inicializar a cena.`,
      );
      return;
    }

    try {
      this.scene.sound.play(key, { ...config, volume: vol });
    } catch (e) {
      console.warn(
        `[AudioManager] Falha ao tentar tocar o áudio Phaser '${key}':`,
        e,
      );
    }
  }

  stop(key) {
    // Para UI sounds nativos
    if (this.activeUiSources[key]) {
      this.activeUiSources[key].forEach((source) => {
        try {
          source.stop();
        } catch (e) {}
      });
      this.activeUiSources[key] = [];
    }

    // Para sons do Phaser
    if (this.scene && this.scene.sound && this.scene.sound.sounds) {
      this.scene.sound.sounds.forEach((sound) => {
        if (sound.key === key) sound.stop();
      });
    }
  }

  stopAll() {
    if (this.scene && this.scene.sound) {
      this.scene.sound.stopAll();
    }
    Object.values(this.activeUiSources).forEach((sourceArray) => {
      sourceArray.forEach((source) => {
        try {
          source.stop();
        } catch (e) {}
      });
    });
    this.activeUiSources = {};
  }

  setVolume(volume) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    if (this.scene && this.scene.sound) {
      this.scene.sound.volume = this.globalVolume;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.scene && this.scene.sound) {
      this.scene.sound.mute = this.muted;
    }
    return this.muted;
  }
}

const instance = new AudioManager();
export default instance;
