/**
 * Registro central de personagens.
 * Para adicionar um personagem novo:
 *   1. adicione uma entrada aqui;
 *   2. adicione os sprites em src/assets/sprites/<id>_<emocao>.png
 *      (no mínimo <id>_neutral.png, que é o fallback);
 *   3. adicione o nome em story.characters.<id> no pt-BR.json.
 */
export const characters = {
  assistant: { color: "#2b6cb0" },
  manager: { color: "#c53030" },
  helena: { color: "#2f855a" },
};
