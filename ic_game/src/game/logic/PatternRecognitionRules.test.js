import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  AnswerSlot,
  AnswerStatus,
  NO_ANSWER,
  evaluateAnswer,
  isOverSlot,
  shuffleLevelOptions,
} from "./PatternRecognitionRules.js";
import { LEVEL_CONFIGS } from "../data/PatternRecognitionLevels.js";
import { STORY_STAGES } from "../data/progressionConfig.js";
import { scenes } from "../../data/dialogues/index.js";
import { characters } from "../../data/characters.js";
import {
  computeColumns,
  computeGridPositions,
  getCellWidth,
} from "../utils/gridLayout.js";

const ptBR = JSON.parse(
  fs.readFileSync(new URL("../../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("computeColumns: uma linha até 5 opções, duas linhas equilibradas acima disso", () => {
  assert.equal(computeColumns(0), 0);
  assert.equal(computeColumns(4), 4);
  assert.equal(computeColumns(5), 5);
  assert.equal(computeColumns(8), 4); // grade 4x2
  assert.equal(computeColumns(6), 3);
});

test("computeGridPositions: 8 opções formam 2 linhas de 4, simétricas", () => {
  const width = 800;
  const pos = computeGridPositions({
    count: 8,
    columns: 4,
    width,
    startY: 100,
    rowGap: 50,
  });
  assert.equal(pos.length, 8);
  assert.equal(pos[0].y, 100);
  assert.equal(pos[4].y, 150);
  assert.equal(pos[0].x, getCellWidth(width, 4));
  assert.equal(pos[0].x + pos[3].x, width); // simetria
});

test("computeGridPositions: uma linha igual ao espaçamento width/(n+1) original", () => {
  const pos = computeGridPositions({
    count: 5,
    columns: 5,
    width: 600,
    startY: 0,
    rowGap: 0,
  });
  pos.forEach((p, i) => assert.ok(Math.abs(p.x - (600 / 6) * (i + 1)) < 1e-9));
});

test("computeGridPositions: última linha incompleta é centralizada", () => {
  const pos = computeGridPositions({
    count: 5,
    columns: 3,
    width: 400,
    startY: 0,
    rowGap: 10,
  });
  assert.equal((pos[3].x + pos[4].x) / 2, 200);
});

test("AnswerSlot: place, deslocamento, release e clear", () => {
  const slot = new AnswerSlot();
  assert.ok(slot.isEmpty);
  assert.equal(slot.place(2), NO_ANSWER);
  assert.equal(slot.place(3), 2); // 2 foi deslocada
  assert.equal(slot.place(3), NO_ANSWER); // mesma peça de novo
  slot.release(2); // não é a ocupante: ignora
  assert.equal(slot.occupant, 3);
  slot.release(3);
  assert.ok(slot.isEmpty);
  slot.place(1);
  slot.clear();
  assert.ok(slot.isEmpty);
});

test("evaluateAnswer", () => {
  assert.equal(evaluateAnswer(NO_ANSWER, 3), AnswerStatus.EMPTY);
  assert.equal(evaluateAnswer(3, 3), AnswerStatus.CORRECT);
  assert.equal(evaluateAnswer(1, 3), AnswerStatus.INCORRECT);
  assert.equal(evaluateAnswer(0, 0), AnswerStatus.CORRECT); // índice 0 é válido
});

test("isOverSlot", () => {
  assert.ok(isOverSlot(100, 100, 100, 100, 80));
  assert.ok(isOverSlot(140, 100, 100, 100, 80)); // dentro da tolerância
  assert.ok(!isOverSlot(200, 100, 100, 100, 80));
});

test("shuffleLevelOptions: preserva todas as opções e atualiza correctOptionIndex", () => {
  const original = {
    difficulty: 1,
    type: "rotation",
    shape: "triangle",
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270
  };

  const shuffled = shuffleLevelOptions(original);

  // Não muta o original
  assert.notEqual(shuffled, original);
  assert.equal(shuffled.answerOptions.length, 4);

  // O valor correto permanece 270 no novo índice
  assert.equal(shuffled.answerOptions[shuffled.correctOptionIndex], 270);

  // Todas as opções originais ainda estão presentes
  assert.deepEqual(
    [...shuffled.answerOptions].sort((a, b) => a - b),
    [0, 90, 180, 270],
  );

  // A validação de acerto continua funcionando
  assert.equal(
    evaluateAnswer(shuffled.correctOptionIndex, shuffled.correctOptionIndex),
    AnswerStatus.CORRECT,
  );
});

test("shuffleLevelOptions: determinístico com mock RNG", () => {
  const config = {
    answerOptions: [10, 20, 30],
    correctOptionIndex: 1, // 20
  };

  // Mock RNG que inverte posições
  let counter = 0;
  const mockRng = () => {
    counter++;
    return 0; // sempre troca com o primeiro
  };

  const result = shuffleLevelOptions(config, mockRng);
  assert.equal(result.answerOptions[result.correctOptionIndex], 20);
});

test("shuffleLevelOptions: embaralha objetos de transformação preservando propriedades e resposta correta", () => {
  const transformConfig = {
    type: "transformation",
    shape: "split_square",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 0, flipX: false, flipY: false },
      { angle: 90, flipX: false, flipY: false }, // Correta
      { angle: 180, flipX: false, flipY: false },
      { angle: 270, flipX: false, flipY: false },
    ],
    correctOptionIndex: 1,
  };

  const shuffled = shuffleLevelOptions(transformConfig);
  assert.notEqual(shuffled, transformConfig);
  assert.equal(shuffled.answerOptions.length, 4);

  const correctItem = shuffled.answerOptions[shuffled.correctOptionIndex];
  assert.equal(correctItem.angle, 90);
  assert.equal(correctItem.flipX, false);

  assert.equal(
    evaluateAnswer(shuffled.correctOptionIndex, shuffled.correctOptionIndex),
    AnswerStatus.CORRECT,
  );
});

test("LEVEL_CONFIGS: todas as fases possuem promptKey e hintKey traduzidos em pt-BR.json", () => {
  assert.ok(LEVEL_CONFIGS.length >= 22);
  assert.equal(
    typeof resolveI18nPath(ptBR, "pattern.mechanics.drag_to_slot"),
    "string",
  );

  LEVEL_CONFIGS.forEach((level, index) => {
    assert.ok(level.promptKey, `Fase ${index + 1} sem promptKey`);
    assert.ok(level.hintKey, `Fase ${index + 1} sem hintKey`);

    const promptText = resolveI18nPath(ptBR, level.promptKey);
    const hintText = resolveI18nPath(ptBR, level.hintKey);

    assert.equal(
      typeof promptText,
      "string",
      `Tradução ausente para promptKey "${level.promptKey}" na fase ${index + 1}`,
    );
    assert.ok(promptText.length > 0);

    assert.equal(
      typeof hintText,
      "string",
      `Tradução ausente para hintKey "${level.hintKey}" na fase ${index + 1}`,
    );
    assert.ok(hintText.length > 0);

    if (Array.isArray(level.steps)) {
      const shuffled = shuffleLevelOptions(level);
      assert.equal(shuffled.steps.length, level.steps.length);

      level.steps.forEach((step, stepIdx) => {
        assert.equal(
          typeof resolveI18nPath(ptBR, step.promptKey),
          "string",
          `Tradução ausente para step.promptKey "${step.promptKey}"`,
        );
        assert.equal(
          typeof resolveI18nPath(ptBR, step.hintKey),
          "string",
          `Tradução ausente para step.hintKey "${step.hintKey}"`,
        );

        const expectedOption = level.answerOptions[step.correctOptionIndex];
        const shuffledOption =
          shuffled.answerOptions[shuffled.steps[stepIdx].correctOptionIndex];
        assert.deepEqual(shuffledOption, expectedOption);
      });
    }
  });
});

test("post-pattern-recognition-2 e Etapa 2: bifurcação dia/noite, tipster_bot e lobby", () => {
  assert.ok(characters.tipster_bot);
  assert.equal(
    typeof resolveI18nPath(ptBR, "story.characters.tipster_bot"),
    "string",
  );

  const stage2 = STORY_STAGES.find(
    (s) => s.id === "stage-2-corrupted-archives",
  );
  assert.ok(stage2);
  assert.equal(stage2.levelStartIndex, 11);
  assert.equal(stage2.nightLevelStartIndex, 16);
  assert.equal(stage2.opensLobbyOnComplete, true);

  const postScene = scenes["post-pattern-recognition-2"];
  assert.ok(postScene);
  assert.equal(postScene.start, "check_shift");

  const branchFn = postScene.nodes.check_shift.branch;
  assert.equal(
    branchFn({ story: { storyDecisions: { stage2TimeOfDay: "night" } } }),
    "tipster_bot_joins",
  );
  assert.equal(
    branchFn({ story: { storyDecisions: { stage2TimeOfDay: "day" } } }),
    "assistant_all_done",
  );

  // Verifica que todos os nós de mensagem da cena possuem texto no pt-BR.json
  Object.entries(postScene.nodes).forEach(([nodeId, node]) => {
    if (!node.type || node.type === "message") {
      const text = resolveI18nPath(
        ptBR,
        `story.scenes.post-pattern-recognition-2.${nodeId}`,
      );
      assert.equal(
        typeof text,
        "string",
        `Texto ausente para post-pattern-recognition-2.${nodeId}`,
      );
      assert.ok(text.length > 0);
    }
  });
});
