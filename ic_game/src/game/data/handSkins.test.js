import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_HAND_SKIN_ID, HAND_SKINS, getHandSkin } from "./handSkins.js";

test("HAND_SKINS: todas as skins registradas possuem assets válidos", () => {
  for (const [key, skin] of Object.entries(HAND_SKINS)) {
    assert.equal(skin.id, key);
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

test("getHandSkin: retorna a skin solicitada ou faz fallback para 'blue'", () => {
  assert.equal(getHandSkin("blue").id, "blue");
  assert.equal(getHandSkin("cow").id, "cow");
  assert.equal(getHandSkin("non_existent_skin").id, DEFAULT_HAND_SKIN_ID);
  assert.equal(getHandSkin().id, DEFAULT_HAND_SKIN_ID);
});
