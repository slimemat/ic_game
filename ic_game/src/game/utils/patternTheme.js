import themeConfig from "../data/PatternRecognitionThemes.json";

const BASE_URL = import.meta.env.BASE_URL;
const REMOTE_URL = /^(https?:)?\/\/|^data:/i;

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Mescla `override` sobre `base` (recursivo). Chaves ausentes herdam do base. */
function deepMerge(base, override = {}) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] =
      isPlainObject(value) && isPlainObject(base[key])
        ? deepMerge(base[key], value)
        : value;
  }
  return result;
}

/** "#63b3ed" -> 0x63b3ed (formato que o Phaser usa em shapes/tint). */
const hexToNumber = (hex) => parseInt(String(hex).replace("#", ""), 16);

/** Caminhos relativos do JSON apontam para `public/`. */
function resolveUrl(path) {
  if (!path) return null;
  if (REMOTE_URL.test(path)) return path;
  return `${BASE_URL}${path.replace(/^\//, "")}`;
}

/** Chave única de cache do Phaser para um asset de um tema. */
export const assetKey = (themeId, name) => `pattern:${themeId}:${name}`;

export function getThemeIdForLevel(level) {
  const stages = [...themeConfig.stages].sort(
    (a, b) => a.fromLevel - b.fromLevel,
  );
  let themeId = stages[0]?.theme ?? "default";
  for (const stage of stages) {
    if (level >= stage.fromLevel) themeId = stage.theme;
  }
  return themeId;
}

/**
 * Resolve o tema final de um nível, já pronto para a Scene:
 * cores em número, URLs resolvidas, defaults aplicados.
 */
export function getThemeForLevel(level) {
  const id = getThemeIdForLevel(level);
  const raw = deepMerge(themeConfig.themes.default, themeConfig.themes[id]);

  const ui = Object.fromEntries(
    Object.entries(raw.colors).map(([key, hex]) => [key, hexToNumber(hex)]),
  );

  return {
    id,
    backgroundColor: hexToNumber(raw.background.color),
    backgroundImage: resolveUrl(raw.background.image),
    music: raw.music
      ? { url: resolveUrl(raw.music.url), volume: raw.music.volume ?? 0.4 }
      : null,
    dragSprites: {
      rotation: resolveUrl(raw.dragSprites.rotation),
      color: resolveUrl(raw.dragSprites.color),
    },
    ui,
    text: raw.text,
  };
}
