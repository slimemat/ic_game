/**
 * Registro declarativo das skins customizáveis de mão que seguram o Post-it.
 *
 * Princípios SOLID (OCP & DIP):
 * - Novas customizações são adicionadas apenas criando a pasta em
 *   `src/assets/sprites/hands/<skinId>/` e registrando uma entrada via
 *   `createHandSkin` aqui, sem alterar `PostItHand.vue` ou `RardiHintPostIt.vue`.
 */

const DEFAULT_BORDER_COLOR = "#262626";

function resolveHandAsset(skinId, fileName) {
  return new URL(
    `../../assets/sprites/hands/${skinId}/${fileName}.png`,
    import.meta.url,
  ).href;
}

function createHandSkin(
  id,
  { fillColor, borderColor = DEFAULT_BORDER_COLOR, hasArmTile = false } = {},
) {
  return Object.freeze({
    id,
    nameKey: `customization.hands.${id}`,
    thumbSrc: resolveHandAsset(id, "thumb"),
    palmBackSrc: resolveHandAsset(id, "palm-back"),
    arm: Object.freeze({
      tileSrc: hasArmTile ? resolveHandAsset(id, "arm") : null,
      fillColor,
      borderColor,
    }),
  });
}

export const DEFAULT_HAND_SKIN_ID = "blue";

export const HAND_SKINS = Object.freeze({
  blue: createHandSkin("blue", { fillColor: "#1c3377" }),
  cow: createHandSkin("cow", { fillColor: "#f8fafc", hasArmTile: true }),
});

/**
 * Retorna a configuração da skin de mão solicitada, com fallback seguro para a padrão.
 * @param {string} [skinId]
 * @returns {typeof HAND_SKINS[keyof typeof HAND_SKINS]}
 */
export function getHandSkin(skinId = DEFAULT_HAND_SKIN_ID) {
  return HAND_SKINS[skinId] || HAND_SKINS[DEFAULT_HAND_SKIN_ID];
}

/**
 * Lista todas as skins de mão registradas para seletores e UI de customização.
 * @returns {Array<typeof HAND_SKINS[keyof typeof HAND_SKINS]>}
 */
export function listHandSkins() {
  return Object.values(HAND_SKINS);
}
