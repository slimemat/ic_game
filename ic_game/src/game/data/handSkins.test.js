import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_HAND_SKIN_ID,
  HAND_SKINS,
  getHandSkin,
  listHandSkins,
} from "./handSkins.js";

const ptBR = JSON.parse(
  readFileSync(new URL("../../locales/pt-BR.json", import.meta.url), "utf8"),
);

function resolveI18nPath(obj, dotPath) {
  return dotPath.split(".").reduce((acc, part) => acc?.[part], obj);
}

test("HAND_SKINS: todas as skins registradas possuem assets e chaves i18n válidos", () => {
  assert.ok(
    HAND_SKINS[DEFAULT_HAND_SKIN_ID],
    `DEFAULT_HAND_SKIN_ID '${DEFAULT_HAND_SKIN_ID}' deve estar registrado em HAND_SKINS`,
  );

  for (const [key, skin] of Object.entries(HAND_SKINS)) {
    assert.equal(skin.id, key);
    assert.ok(
      resolveI18nPath(ptBR, skin.nameKey),
      `${key}: chave i18n '${skin.nameKey}' ausente em pt-BR.json`,
    );
    assert.ok(skin.thumbSrc, `${key}: thumbSrc ausente`);
    assert.ok(skin.palmBackSrc, `${key}: palmBackSrc ausente`);
    assert.ok(
      existsSync(fileURLToPath(skin.thumbSrc)),
      `${key}: arquivo thumb.png não encontrado`,
    );
    assert.ok(
      existsSync(fileURLToPath(skin.palmBackSrc)),
      `${key}: arquivo palm-back.png não encontrado`,
    );
    if (skin.arm.tileSrc) {
      assert.ok(
        existsSync(fileURLToPath(skin.arm.tileSrc)),
        `${key}: arquivo arm.png não encontrado`,
      );
    }
    assert.ok(skin.arm.fillColor);
    assert.ok(skin.arm.borderColor);
  }
});

test("getHandSkin e listHandSkins: resolvem todas as skins registradas e aplicam fallback seguro", () => {
  const registeredIds = Object.keys(HAND_SKINS);
  for (const id of registeredIds) {
    assert.equal(getHandSkin(id).id, id);
  }

  assert.equal(getHandSkin("non_existent_skin").id, DEFAULT_HAND_SKIN_ID);
  assert.equal(getHandSkin().id, DEFAULT_HAND_SKIN_ID);

  const listed = listHandSkins();
  assert.deepEqual(
    listed.map((s) => s.id),
    registeredIds,
  );
});
