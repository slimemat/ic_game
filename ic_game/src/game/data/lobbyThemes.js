/**
 * Declarative registry of Chapter-aware Frutiger Aero Lobby & Chat backdrop themes.
 *
 * Open/Closed Principle:
 * Adding a theme for Chapter 2+ requires only adding a new entry to LOBBY_THEMES
 * and updating `resolveLobbyTheme` / `resolveChatBackdropTheme`, without modifying
 * `LobbyBackdrop.vue`.
 */

const chapter1CloudSprite = new URL(
  "../../assets/images/cloud.png",
  import.meta.url,
).href;

export const LOBBY_THEMES = Object.freeze({
  chapter1: Object.freeze({
    id: "chapter-1",
    chapterNumber: 1,
    skyTop: "#67c8f8",
    skyMid: "#bae6fd",
    skyBottom: "#f0f9ff",
    sunGlow: "rgba(255, 250, 214, 0.85)",
    horizonGlow: "rgba(160, 236, 208, 0.42)",
    cloudSprite: chapter1CloudSprite,
    cloudOpacity: 0.9,
    orbColor: "rgba(255, 255, 255, 0.45)",
  }),
  chapter1Night: Object.freeze({
    id: "chapter-1-night",
    chapterNumber: 1,
    skyTop: "#1e1b4b",
    skyMid: "#312e81",
    skyBottom: "#4c1d95",
    sunGlow: "rgba(196, 181, 253, 0.35)",
    horizonGlow: "rgba(56, 189, 248, 0.25)",
    cloudSprite: chapter1CloudSprite,
    cloudOpacity: 0.28,
    orbColor: "rgba(167, 139, 250, 0.3)",
  }),
});

/**
 * Resolves the active lobby backdrop theme for the player's current chapter/stage.
 * Currently all available stages (1–4) take place in Chapter 1 (Logicompany Day/Office arc).
 *
 * @param {number} [stageNumber=1]
 * @param {Record<string, unknown>} [_storyDecisions={}]
 * @returns {typeof LOBBY_THEMES.chapter1}
 */
export function resolveLobbyTheme(stageNumber = 1, _storyDecisions = {}) {
  void stageNumber;
  void _storyDecisions;
  return LOBBY_THEMES.chapter1;
}

/**
 * Resolves the backdrop theme for Story Mode chat cutscenes based on the active
 * header variant and chapter progression.
 *
 * @param {"default" | "morning" | "bot"} [headerVariant="default"]
 * @param {number} [stageNumber=1]
 * @param {Record<string, unknown>} [storyDecisions={}]
 * @returns {typeof LOBBY_THEMES.chapter1 | typeof LOBBY_THEMES.chapter1Night}
 */
export function resolveChatBackdropTheme(
  headerVariant = "default",
  stageNumber = 1,
  storyDecisions = {},
) {
  if (headerVariant === "bot") {
    return LOBBY_THEMES.chapter1Night;
  }
  return resolveLobbyTheme(stageNumber, storyDecisions);
}
