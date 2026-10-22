import { describe, it, expect } from "vitest";
import { buildRanking } from "./ranking";

const seed = [
  { id: "a", name: "A", xp: 100 },
  { id: "b", name: "B", xp: 300 },
];

describe("buildRanking", () => {
  it("ordena por XP e marca o jogador atual", () => {
    const result = buildRanking(seed, { id: "me", name: "Eu", xp: 200 });
    expect(result.map((p) => p.id)).toEqual(["b", "me", "a"]);
    expect(result.find((p) => p.isMe).position).toBe(2);
  });

  it("em empate, o jogador atual fica na frente", () => {
    const result = buildRanking(seed, { id: "me", name: "Eu", xp: 300 });
    expect(result[0].id).toBe("me");
  });

  it("não altera a lista original", () => {
    buildRanking(seed, { id: "me", name: "Eu", xp: 0 });
    expect(seed).toHaveLength(2);
  });
});
