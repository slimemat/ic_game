import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TUTORIALS_CONFIG, getTutorialForLevel } from "./tutorialsConfig.js";

const ptBR = JSON.parse(
  fs.readFileSync(new URL("../../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("TUTORIALS_CONFIG: todos os tutoriais possuem campos obrigatórios e chaves i18n válidas", () => {
  const tutorials = Object.values(TUTORIALS_CONFIG);
  assert.ok(tutorials.length >= 4);

  for (const tut of tutorials) {
    assert.ok(tut.id, "Tutorial deve ter ID");
    assert.ok(tut.gameId, "Tutorial deve ter gameId");
    assert.ok(
      tut.triggerLevel === null || tut.triggerLevel > 0,
      "Tutorial deve ter triggerLevel positivo ou null quando agrupado/manual",
    );
    assert.ok(tut.interactionType, "Tutorial deve ter interactionType");

    assert.ok(
      resolveI18nPath(ptBR, tut.titleKey),
      `Chave titleKey não encontrada em pt-BR.json: ${tut.titleKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, tut.subtitleKey),
      `Chave subtitleKey não encontrada em pt-BR.json: ${tut.subtitleKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, tut.feedbackKey),
      `Chave feedbackKey não encontrada em pt-BR.json: ${tut.feedbackKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, tut.instructionKey),
      `Chave instructionKey não encontrada em pt-BR.json: ${tut.instructionKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, tut.explanationKey),
      `Chave explanationKey não encontrada em pt-BR.json: ${tut.explanationKey}`,
    );
  }
});

test("TUTORIALS_CONFIG: não possui triggerLevel duplicados para o mesmo gameId (evita reabertura imediata)", () => {
  const seen = new Set();
  for (const tut of Object.values(TUTORIALS_CONFIG)) {
    if (tut.triggerLevel !== null && tut.triggerLevel !== undefined) {
      const key = `${tut.gameId}:${tut.triggerLevel}`;
      assert.ok(
        !seen.has(key),
        `triggerLevel duplicado detectado para ${key} no tutorial ${tut.id}`,
      );
      seen.add(key);
    }
  }
});

test("getTutorialForLevel: resolve a oficina de orientação espacial no nível 1", () => {
  // Nível 1: Oficina de Orientação Espacial Unificada
  const tutL1 = getTutorialForLevel("pattern-recognition", 1);
  assert.ok(tutL1);
  assert.equal(tutL1.id, "spatial_orientation");
  assert.deepEqual(tutL1.bundledTutorialIds, [
    "rotation_cw",
    "rotation_ccw",
    "flip_h",
    "flip_v",
  ]);

  // Nível sem tutorial novo cadastrado
  const tutNone = getTutorialForLevel("pattern-recognition", 5);
  assert.equal(tutNone, null);
});

test("getTutorialForLevel: respeita o predicado isCompletedFn para não re-exibir tutoriais já feitos", () => {
  const isCompleted = (id) => id === "spatial_orientation";

  assert.equal(
    getTutorialForLevel("pattern-recognition", 1, isCompleted),
    null,
    "Tutorial concluído deve retornar null",
  );
});

test("TUTORIALS_CONFIG: spatial_orientation possui as 4 notas do Rardi configuradas e traduzidas na ordem correta", () => {
  const tut = TUTORIALS_CONFIG.spatial_orientation;
  assert.ok(tut);
  assert.ok(Array.isArray(tut.rardiNotes));
  assert.equal(tut.rardiNotes.length, 4);

  const expectedActions = ["rotate_cw", "rotate_ccw", "flip_h", "flip_v"];
  tut.rardiNotes.forEach((note, idx) => {
    assert.equal(note.actionKey, expectedActions[idx]);
    assert.ok(
      resolveI18nPath(ptBR, note.titleKey),
      `Missing titleKey ${note.titleKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, note.shortTagKey),
      `Missing shortTagKey ${note.shortTagKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, note.textKey),
      `Missing textKey ${note.textKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, note.promptKey),
      `Missing promptKey ${note.promptKey}`,
    );
  });
});
