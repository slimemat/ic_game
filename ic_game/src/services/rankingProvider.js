import { RANKING_SEED } from "../data/rankingSeed.js";

/**
 * Dependency Inversion (DIP) repository abstraction for leaderboard entries.
 * Swap `defaultRankingProvider` for an API-backed provider when backend sync is ready.
 *
 * @param {readonly Record<string, unknown>[]} [seedEntries=RANKING_SEED]
 * @returns {{ getEntries: () => Record<string, unknown>[] }}
 */
export function createLocalRankingProvider(seedEntries = RANKING_SEED) {
  return {
    getEntries() {
      return (seedEntries || []).map((entry) => ({ ...entry }));
    },
  };
}

export const defaultRankingProvider = createLocalRankingProvider();
