import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RANKING_SEED } from "../data/rankingSeed.js";
import {
  createLocalRankingProvider,
  defaultRankingProvider,
} from "./rankingProvider.js";
import { buildRanking } from "../game/logic/ranking.js";

const ptBR = JSON.parse(
  readFileSync(new URL("../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("RANKING_SEED: contém benchmarks da Logicompany com chaves i18n válidas", () => {
  assert.ok(RANKING_SEED.length >= 3);
  for (const entry of RANKING_SEED) {
    assert.ok(entry.id);
    assert.ok(typeof entry.xp === "number" && entry.xp > 0);
    assert.ok(
      resolveI18nPath(ptBR, entry.nameKey),
      `Chave ausente: ${entry.nameKey}`,
    );
    assert.ok(
      resolveI18nPath(ptBR, entry.roleKey),
      `Chave ausente: ${entry.roleKey}`,
    );
  }
});

test("createLocalRankingProvider: retorna cópia isolada e integra com buildRanking", () => {
  const customProvider = createLocalRankingProvider([
    { id: "npc-1", name: "Malu", xp: 500 },
  ]);
  const entries = customProvider.getEntries();
  entries[0].xp = 9999;

  // Original seed passed to provider was not mutated
  assert.equal(customProvider.getEntries()[0].xp, 500);

  const defaultEntries = defaultRankingProvider.getEntries();
  const ranked = buildRanking(defaultEntries, {
    id: "me",
    name: "Estagiário",
    xp: 700,
  });
  const me = ranked.find((item) => item.isMe);
  assert.ok(me);
  assert.equal(ranked[0].xp >= ranked[ranked.length - 1].xp, true);
});
