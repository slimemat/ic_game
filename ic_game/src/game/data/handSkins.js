/**
 * Registro declarativo das skins customizáveis de mão que seguram o Post-it.
 *
 * Princípios SOLID (OCP & DIP):
 * - Novas customizações são adicionadas apenas criando a pasta em
 *   `src/assets/sprites/hands/<skinId>/` e registrando uma entrada aqui,
 *   sem alterar `PostItHand.vue` ou `RardiHintPostIt.vue`.
 */

export const DEFAULT_HAND_SKIN_ID = "blue";

export const HAND_SKINS = Object.freeze({
  blue: Object.freeze({
    id: "blue",
    nameKey: "customization.hands.blue",
    thumbSrc: new URL(
      "../../assets/sprites/hands/blue/thumb.png",
      import.meta.url,
    ).href,
    palmBackSrc: new URL(
      "../../assets/sprites/hands/blue/palm-back.png",
      import.meta.url,
    ).href,
    arm: Object.freeze({
      tileSrc: null,
      fillColor: "#1c3377",
      borderColor: "#262626",
    }),
  }),
  cow: Object.freeze({
    id: "cow",
    nameKey: "customization.hands.cow",
    thumbSrc: new URL(
      "../../assets/sprites/hands/cow/thumb.png",
      import.meta.url,
    ).href,
    palmBackSrc: new URL(
      "../../assets/sprites/hands/cow/palm-back.png",
      import.meta.url,
    ).href,
    arm: Object.freeze({
      tileSrc: new URL(
        "../../assets/sprites/hands/cow/arm.png",
        import.meta.url,
      ).href,
      fillColor: "#f8fafc",
      borderColor: "#262626",
    }),
  }),
});

/**
 * Retorna a configuração da skin de mão solicitada, com fallback seguro para a padrão.
 * @param {string} [skinId]
 * @returns {typeof HAND_SKINS[keyof typeof HAND_SKINS]}
 */
export function getHandSkin(skinId = DEFAULT_HAND_SKIN_ID) {
  return HAND_SKINS[skinId] || HAND_SKINS[DEFAULT_HAND_SKIN_ID];
}
