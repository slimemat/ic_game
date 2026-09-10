/**
 * AudioManager - Singleton
 * Wrapper para facilitar o acesso aos sons do Phaser de qualquer lugar do projeto (inclusive do Vue).
 */

class AudioManager {
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    this.scene = null; // Instância da Scene ativa do Phaser
    this.sounds = {};
    
    // Configurações globais
    this.globalVolume = 1.0;
    this.muted = false;

    AudioManager.instance = this;
  }

  /**
   * Inicializa o gerenciador com a cena atual. 
   * Deve ser chamado no create() da cena principal ou cena de boot.
   * @param {Phaser.Scene} scene 
   */
  init(scene) {
    this.scene = scene;
    console.log('[AudioManager] Inicializado com a cena:', scene.scene.key);
  }

  /**
   * Toca um som se ele já estiver carregado na cena.
   * @param {string} key - A chave do áudio (ex: 'win', 'error', 'connect')
   * @param {object} config - Configurações opcionais (volume, loop, etc)
   */
  play(key, config = {}) {
    if (!this.scene) {
      console.warn('[AudioManager] Tentativa de tocar som sem inicializar a cena.');
      return;
    }

    if (this.muted) return;

    // Ajusta o volume com base no volume global
    const finalConfig = {
      ...config,
      volume: (config.volume !== undefined ? config.volume : 1) * this.globalVolume
    };

    try {
      this.scene.sound.play(key, finalConfig);
    } catch (e) {
      console.warn(`[AudioManager] Falha ao tentar tocar o áudio '${key}':`, e);
    }
  }

  stopAll() {
    if (this.scene && this.scene.sound) {
      this.scene.sound.stopAll();
    }
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

