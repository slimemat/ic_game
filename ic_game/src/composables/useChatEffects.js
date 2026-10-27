import { ref } from "vue";
import AudioManager from "../game/managers/AudioManager";
import { dialogueEffects } from "../data/dialogues/effects";

const SHAKE_DURATION_MS = 450;

/**
 * Aplica os efeitos de cena (som, tremida de tela e vibração háptica)
 * declarados nos nós de diálogo via `effects: ["<id>"]`.
 *
 * Retorna:
 *   isShaking – ref booleana para ligar a classe de tremida no container
 *   apply     – aplica uma lista de ids de efeito
 *   stopAll   – interrompe sons de efeitos e a tremida (troca de nó / unmount)
 */
export function useChatEffects() {
  const isShaking = ref(false);
  const activeSfx = new Set();
  let shakeTimeout = null;

  const prefersReducedMotion = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  function shake() {
    if (prefersReducedMotion()) return;
    clearTimeout(shakeTimeout);
    // Reinicia a animação caso já esteja tremendo
    isShaking.value = false;
    requestAnimationFrame(() => {
      isShaking.value = true;
      shakeTimeout = setTimeout(() => {
        isShaking.value = false;
      }, SHAKE_DURATION_MS);
    });
  }

  function apply(effectIds = []) {
    effectIds.forEach((id) => {
      const effect = dialogueEffects[id];
      if (!effect) {
        console.warn(`[useChatEffects] Efeito "${id}" não registrado.`);
        return;
      }
      if (effect.sfx) {
        AudioManager.play(effect.sfx, { volume: effect.volume ?? 1 });
        activeSfx.add(effect.sfx);
      }
      if (effect.shake) shake();
      if (effect.haptic) navigator.vibrate?.(effect.haptic);
    });
  }

  function stopAll() {
    activeSfx.forEach((key) => AudioManager.stop(key));
    activeSfx.clear();
    clearTimeout(shakeTimeout);
    isShaking.value = false;
  }

  return { isShaking, apply, stopAll };
}
