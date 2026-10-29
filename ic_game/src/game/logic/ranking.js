/**
 * Monta o ranking ordenado por XP, marcando o jogador atual.
 * Em empate, o jogador atual aparece na frente.
 *
 * @param {{ id: string, name: string, xp: number }[]} players
 * @param {{ id: string, name: string, xp: number }} me
 * @returns {{ id: string, name: string, xp: number, isMe: boolean, position: number }[]}
 */
export function buildRanking(players, me) {
  return [
    ...players.map((player) => ({ ...player, isMe: false })),
    { ...me, isMe: true },
  ]
    .sort((a, b) => b.xp - a.xp || Number(b.isMe) - Number(a.isMe))
    .map((player, index) => ({ ...player, position: index + 1 }));
}
