/**
 * Logicompany pre-alpha NPC benchmarks used as the default local leaderboard
 * until a backend ranking API is connected.
 */
export const RANKING_SEED = Object.freeze([
  Object.freeze({
    id: "npc-helena",
    nameKey: "story.variables.taskGiver01Name",
    roleKey: "hub.ranking.role_client",
    avatar: "taskGiver01",
    xp: 1250,
  }),
  Object.freeze({
    id: "npc-sergio",
    nameKey: "story.variables.managerName",
    roleKey: "hub.ranking.role_manager",
    avatar: "manager",
    xp: 980,
  }),
  Object.freeze({
    id: "npc-malu",
    nameKey: "story.variables.assistantName",
    roleKey: "hub.ranking.role_assistant",
    avatar: "assistant",
    xp: 640,
  }),
  Object.freeze({
    id: "npc-tipster",
    nameKey: "story.variables.tipsterBotName",
    roleKey: "hub.ranking.role_bot",
    avatar: "tipster_bot",
    xp: 320,
  }),
]);
