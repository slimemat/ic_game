import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { STORY_STAGES } from "../data/progressionConfig.js";
import {
  PROLOGUE_CHAPTER_ID,
  buildStoryChapters,
  buildStoryRecap,
  hasStoryProgress,
  resolveChapterDay,
} from "./storyChapters.js";

const ptBR = JSON.parse(
  fs.readFileSync(new URL("../../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("buildStoryChapters: novo jogador inicia com o Prólogo atual e etapas disponíveis", () => {
  const chapters = buildStoryChapters({
    stages: STORY_STAGES,
    currentStageId: STORY_STAGES[0].id,
    checkpoint: "intro-cutscene",
    completedStageIds: [],
    introCheckpoint: "intro-cutscene",
  });

  assert.equal(chapters.length, STORY_STAGES.length + 1);
  assert.equal(chapters[0].id, PROLOGUE_CHAPTER_ID);
  assert.equal(chapters[0].kind, "prologue");
  assert.equal(chapters[0].status, "current");

  chapters.slice(1).forEach((chapter, idx) => {
    assert.equal(chapter.kind, "stage");
    assert.equal(chapter.id, STORY_STAGES[idx].id);
    assert.equal(chapter.status, "available");
  });
});

test("buildStoryChapters: marca Prólogo e etapas concluídas como done e a ativa como current", () => {
  const chapters = buildStoryChapters({
    stages: STORY_STAGES,
    currentStageId: STORY_STAGES[1].id,
    checkpoint: "dashboard",
    completedStageIds: [STORY_STAGES[0].id],
    introCheckpoint: "intro-cutscene",
  });

  assert.equal(chapters[0].status, "done");
  assert.equal(chapters[1].status, "done");
  assert.equal(chapters[2].status, "current");
  assert.equal(chapters[3].status, "available");
  assert.equal(chapters[4].status, "available");
});

test("resolveChapterDay: resolve dia coerente por etapa e decisão de turno", () => {
  assert.equal(resolveChapterDay(1, { stage2TimeOfDay: "day" }, 2), 1);
  assert.equal(resolveChapterDay(2, { stage2TimeOfDay: "night" }, 1), 1);
  assert.equal(resolveChapterDay(2, { stage2TimeOfDay: "day" }, 1), 2);
  assert.equal(resolveChapterDay(3, {}, 1), 2);
  assert.equal(resolveChapterDay(4, {}, 3), 3);
});

test("i18n: chaves do seletor amigável da História e toggle de debug existem em pt-BR.json", () => {
  const requiredKeys = [
    "hub.story.subtitle_current",
    "hub.story.recap_title",
    "hub.story.recap_last_label",
    "hub.story.recap_next_label",
    "hub.story.recap_new_journey",
    "hub.story.recap_prologue_done",
    "hub.story.recap_all_done",
    "hub.story.chapters_title",
    "hub.story.chapters_aria",
    "hub.story.prologue_eyebrow",
    "hub.story.prologue_title",
    "hub.story.prologue_meta",
    "hub.story.status_done",
    "hub.story.status_current",
    "hub.story.status_available",
    "hub.story.reset_btn",
    "hub.story.reset_confirm_title",
    "hub.story.reset_confirm_message",
    "hub.story.reset_cancel",
    "hub.story.reset_confirm",
    "hub.story.reset_done",
    "hub.home.btn_start",
    "hub.home.btn_continue",
    "hub.home.chapter_badge",
    "hub.ranking.subtitle",
    "hub.debug.toggle_show",
    "hub.debug.toggle_hide",
  ];

  for (const key of requiredKeys) {
    const value = resolveI18nPath(ptBR, key);
    assert.equal(typeof value, "string", `Chave i18n ausente: ${key}`);
    assert.ok(value.trim().length > 0, `Chave i18n vazia: ${key}`);
  }

  assert.equal(
    ptBR.story.stages.stage4.title.includes("Chamado #04"),
    false,
    "stage4.title não deve duplicar o prefixo 'Chamado #04'",
  );
});

test("hasStoryProgress e buildStoryRecap: resumem estado inicial, em andamento e concluído", () => {
  assert.equal(
    hasStoryProgress({
      checkpoint: "intro-cutscene",
      totalXp: 0,
      completedStageIds: [],
      introCheckpoint: "intro-cutscene",
    }),
    false,
  );
  assert.equal(
    hasStoryProgress({
      checkpoint: "dashboard",
      totalXp: 0,
      completedStageIds: [],
      introCheckpoint: "intro-cutscene",
    }),
    true,
  );

  const initialRecap = buildStoryRecap({
    stages: STORY_STAGES,
    currentStageId: STORY_STAGES[0].id,
    checkpoint: "intro-cutscene",
    completedStageIds: [],
    totalXp: 0,
    introCheckpoint: "intro-cutscene",
  });
  assert.equal(initialRecap.isNewJourney, true);
  assert.equal(initialRecap.lastCompletedStage, null);
  assert.equal(initialRecap.nextStage.id, STORY_STAGES[0].id);

  const midRecap = buildStoryRecap({
    stages: STORY_STAGES,
    currentStageId: STORY_STAGES[1].id,
    checkpoint: "lobby",
    completedStageIds: [STORY_STAGES[0].id],
    totalXp: 200,
    introCheckpoint: "intro-cutscene",
  });
  assert.equal(midRecap.isNewJourney, false);
  assert.equal(midRecap.lastCompletedStage.id, STORY_STAGES[0].id);
  assert.equal(midRecap.nextStage.id, STORY_STAGES[1].id);
  assert.equal(midRecap.allCompleted, false);
});
