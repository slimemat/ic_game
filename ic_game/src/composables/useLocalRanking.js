import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useProgressionStore } from "../stores/progression";
import { defaultRankingProvider } from "../services/rankingProvider";
import { buildRanking } from "../game/logic/ranking";
import assistantAvatar from "../assets/sprites/assistant_neutral.png";
import managerAvatar from "../assets/sprites/manager_neutral.png";
import taskGiver01Avatar from "../assets/sprites/taskGiver01_neutral.png";
import tipsterBotAvatar from "../assets/sprites/tipster_bot_neutral.png";

const AVATAR_SPRITES = {
  assistant: assistantAvatar,
  manager: managerAvatar,
  taskGiver01: taskGiver01Avatar,
  tipster_bot: tipsterBotAvatar,
};

/**
 * Composable de Ranking: combina benchmarks do provedor com o XP do jogador
 * vindo de `progressionStore`.
 *
 * @param {{ getEntries: () => Array }} [provider=defaultRankingProvider]
 */
export function useLocalRanking(provider = defaultRankingProvider) {
  const { t } = useI18n();
  const session = useGameSessionStore();
  const progression = useProgressionStore();

  const ranking = computed(() => {
    const entries = provider.getEntries().map((entry) => ({
      ...entry,
      name: entry.nameKey ? t(entry.nameKey) : entry.name,
      roleLabel: entry.roleKey ? t(entry.roleKey) : entry.roleLabel || "",
      avatarSrc: entry.avatar ? AVATAR_SPRITES[entry.avatar] || null : null,
    }));

    return buildRanking(entries, {
      id: "me",
      name: session.playerName || t("hub.profile.player_fallback"),
      roleLabel: t(progression.currentRank.titleKey),
      avatarSrc: null,
      xp: progression.totalXp,
    });
  });

  return { ranking };
}
