/**
 * Registro de efeitos de cena usados pelos nós de diálogo (`effects: [...]`).
 * Para criar um efeito novo, basta adicionar uma entrada aqui.
 *
 *   sfx    – chave de som registrada no AudioManager
 *   volume – volume do sfx (0..1)
 *   shake  – tremida horizontal da tela do chat
 *   haptic – duração (ms) da vibração do aparelho (mobile), se suportado
 */
export const dialogueEffects = {
  phoneRing: { sfx: "telephone_ring", volume: 0.2, shake: true, haptic: 100 },
};
