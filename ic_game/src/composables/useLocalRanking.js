import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useProgressionStore } from "../stores/progression";
import { RANKING_SEED } from "../data/rankingSeed";
import { buildRanking } from "../game/logic/ranking";

/**
 * Ranking local: XP do jogador vem da progressionStore.
 * Trocar RANKING_SEED por uma chamada à API quando houver back-end.
 */
export function useLocalRanking() {
  const { t } = useI18n();
  const session = useGameSessionStore();
  const progression = useProgressionStore();

  const ranking = computed(() =>
    buildRanking(RANKING_SEED, {
      id: "me",
      name: session.playerName || t("hub.profile.player_fallback"),
      xp: progression.totalXp,
    }),
  );

  return { ranking };
}
