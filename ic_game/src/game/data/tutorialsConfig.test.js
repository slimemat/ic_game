import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  TUTORIALS_CONFIG,
  getTutorialForLevel,
  resolveVisualHintForLevel,
} from "./tutorialsConfig.js";
import { LEVEL_CONFIGS } from "./PatternRecognitionLevels.js";

const ptBR = JSON.parse(
  fs.readFileSync(new URL("../../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("TUTORIALS_CONFIG: todos os tutoriais possuem campos obrigatórios e chaves i18n válidas", () => {
  const tutorials = Object.values(TUTORIALS_CONFIG);
  assert.ok(tutorials.length >= 5);

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

test("getTutorialForLevel: resolve Rotação no nível 1 e Espelhamento nos níveis 11 e 16 (Just-in-Time)", () => {
  // Nível 1: Tutorial de Rotação (Etapa 1)
  const tutL1 = getTutorialForLevel("pattern-recognition", 1);
  assert.ok(tutL1);
  assert.equal(tutL1.id, "spatial_orientation");
  assert.deepEqual(tutL1.bundledTutorialIds, ["rotation_cw", "rotation_ccw"]);

  // Nível 11 (Etapa 2 Turno Dia) e Nível 16 (Etapa 2 Turno Noite): Tutorial de Espelhamento
  const tutL11 = getTutorialForLevel("pattern-recognition", 11);
  assert.ok(tutL11);
  assert.equal(tutL11.id, "spatial_reflection");
  assert.deepEqual(tutL11.bundledTutorialIds, ["flip_h", "flip_v"]);

  const tutL16 = getTutorialForLevel("pattern-recognition", 16);
  assert.ok(tutL16);
  assert.equal(tutL16.id, "spatial_reflection");

  // Nível sem tutorial novo cadastrado
  const tutNone = getTutorialForLevel("pattern-recognition", 5);
  assert.equal(tutNone, null);
});

test("getTutorialForLevel: respeita o predicado isCompletedFn para não re-exibir tutoriais já feitos", () => {
  const isCompleted = (id) =>
    id === "spatial_orientation" || id === "spatial_reflection";

  assert.equal(
    getTutorialForLevel("pattern-recognition", 1, isCompleted),
    null,
    "Tutorial de rotação concluído deve retornar null",
  );
  assert.equal(
    getTutorialForLevel("pattern-recognition", 11, isCompleted),
    null,
    "Tutorial de espelhamento concluído deve retornar null no nível 11",
  );
  assert.equal(
    getTutorialForLevel("pattern-recognition", 16, isCompleted),
    null,
    "Tutorial de espelhamento concluído deve retornar null no nível 16",
  );
});

test("TUTORIALS_CONFIG: spatial_orientation e spatial_reflection possuem notas visuais, regra de ouro e 3 alternativas válidas", () => {
  const checkTutorialNotes = (tut, expectedActions) => {
    assert.ok(tut);
    assert.ok(Array.isArray(tut.rardiNotes));
    assert.equal(tut.rardiNotes.length, expectedActions.length);

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
      const hasVisualExplanation =
        (Array.isArray(note.sketchImages) && note.sketchImages.length > 0) ||
        Boolean(
          note.goldenRuleKey && resolveI18nPath(ptBR, note.goldenRuleKey),
        );
      assert.ok(
        hasVisualExplanation,
        `Nota ${note.id} deve ter sketchImages ou goldenRuleKey válida`,
      );
      assert.ok(
        resolveI18nPath(ptBR, note.textKey),
        `Missing textKey ${note.textKey}`,
      );
      assert.ok(
        resolveI18nPath(ptBR, note.promptKey),
        `Missing promptKey ${note.promptKey}`,
      );

      assert.ok(Array.isArray(note.options), "Nota deve ter lista de options");
      assert.equal(note.options.length, 3, "Cada passo deve ter 3 opções");
      const correctOptions = note.options.filter((o) => o.isCorrect);
      assert.equal(
        correctOptions.length,
        1,
        "Cada passo deve ter exatamente 1 opção correta",
      );

      note.options
        .filter((o) => !o.isCorrect)
        .forEach((distractor) => {
          assert.ok(
            resolveI18nPath(ptBR, distractor.errorTipKey),
            `Distrator sem errorTipKey traduzida: ${distractor.errorTipKey}`,
          );
        });
    });
  };

  checkTutorialNotes(TUTORIALS_CONFIG.spatial_orientation, [
    "rotate_cw",
    "rotate_ccw",
  ]);
  checkTutorialNotes(TUTORIALS_CONFIG.spatial_reflection, ["flip_h", "flip_v"]);
});

test("resolveVisualHintForLevel: retorna o card visual do Rardi para fases espaciais e null para fases de cor", () => {
  // Fase 1 (90° Horário)
  const hintL1 = resolveVisualHintForLevel(LEVEL_CONFIGS[0], 0);
  assert.ok(hintL1);
  assert.equal(hintL1.concept, "rotate_cw");

  // Fase 2 (90° Anti-horário)
  const hintL2 = resolveVisualHintForLevel(LEVEL_CONFIGS[1], 0);
  assert.ok(hintL2);
  assert.equal(hintL2.concept, "rotate_ccw");

  // Fase 12 (Espelho Horizontal)
  const hintL12 = resolveVisualHintForLevel(LEVEL_CONFIGS[11], 0);
  assert.ok(hintL12);
  assert.equal(hintL12.concept, "flip_h");

  // Fase 14 (Espelho Vertical)
  const hintL14 = resolveVisualHintForLevel(LEVEL_CONFIGS[13], 0);
  assert.ok(hintL14);
  assert.equal(hintL14.concept, "flip_v");

  // Fase 21 (Padrão de Cores -> não deve exibir post-it espacial do Rardi)
  const hintL21 = resolveVisualHintForLevel(LEVEL_CONFIGS[20], 0);
  assert.equal(hintL21, null);
});
