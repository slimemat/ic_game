import test from "node:test";
import assert from "node:assert/strict";
import { VISUAL_CONCEPT_CARDS } from "./tutorialsConfig.js";
import {
  buildClockHandPoint,
  buildClockSectorPath,
  getSketchDiagram,
  SPATIAL_DIAGRAMS,
} from "./sketchDiagrams.js";

test("SPATIAL_DIAGRAMS: cobre todos os conceitos de VISUAL_CONCEPT_CARDS", () => {
  for (const card of Object.values(VISUAL_CONCEPT_CARDS)) {
    const diagram = getSketchDiagram(card.concept);
    assert.ok(diagram, `Diagrama ausente para o conceito: ${card.concept}`);
    assert.ok(
      diagram.kind === "clock" || diagram.kind === "mirror",
      `Tipo de diagrama inválido para ${card.concept}`,
    );
  }
});

test("buildClockSectorPath: gera quadrante de 90° e semicírculo completo de 180°", () => {
  const path90 = buildClockSectorPath(90);
  assert.equal(path90, "M 70 65 L 70 21 A 44 44 0 0 1 114 65 Z");

  const path180 = buildClockSectorPath(180);
  assert.equal(path180, "M 70 21 A 44 44 0 0 1 70 109 Z");
});

test("buildClockHandPoint: calcula ponteiro final para 90°, -90° e 180°", () => {
  assert.deepEqual(buildClockHandPoint(90), { x: 102, y: 65 });
  assert.deepEqual(buildClockHandPoint(-90), { x: 38, y: 65 });
  assert.deepEqual(buildClockHandPoint(180), { x: 70, y: 97 });
});

test("getSketchDiagram: retorna null para conceito desconhecido", () => {
  assert.equal(getSketchDiagram("unknown_concept"), null);
  assert.ok(SPATIAL_DIAGRAMS.rotate_cw);
});
