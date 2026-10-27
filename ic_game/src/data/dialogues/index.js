/**
 * Grafos das cenas de diálogo (chat) do Modo História.
 *
 * Configuração de cena:
 *   start         – id do primeiro nó
 *   systemMessage – (opcional) exibe story.scenes.<cena>._system no topo
 *   header        – (opcional) exibe o header de grupo (chamado atual + participantes)
 *
 * Tipos de nó (campo `type`; omitido = "message"):
 *   message  – fala de um personagem. Campos: speaker, emotion, next | choices,
 *              effects? (ids de ./effects.js), forwarded? (rótulo "encaminhada")
 *   presence – aviso centralizado "<nome> entrou/saiu do chat"; avança sozinho.
 *              Campos: action ("join" | "leave"), char, next
 *   notes    – carrossel de post-its. Campos: notes (ids em
 *              story.scenes.<cena>.notes.<id>), next
 *
 * Os textos ficam em story.scenes.<cena>.<idDoNó> no pt-BR.json.
 */
export const scenes = {
  // Cena de abertura do Modo História
  intro: {
    start: "intro",
    systemMessage: true, // lê story.scenes.intro._system
    nodes: {
      intro: {
        speaker: "assistant",
        emotion: "neutral",
        choices: [
          { id: "choiceA", next: "replyA" },
          { id: "choiceB", next: "replyB" },
        ],
      },
      replyA: {
        speaker: "assistant",
        emotion: "explaining",
        next: "call_manager",
      },
      replyB: {
        speaker: "assistant",
        emotion: "explaining",
        next: "call_manager",
      },
      call_manager: {
        speaker: "assistant",
        emotion: "neutral",
        effects: ["phoneRing"], // tremida horizontal + telephone_ring
        next: "manager_joins",
      },
      manager_joins: {
        type: "presence",
        action: "join",
        char: "manager",
        next: "manager_enters",
      },
      manager_enters: {
        speaker: "manager",
        emotion: "explaining",
        next: "manager_explains",
      },
      manager_explains: {
        speaker: "manager",
        emotion: "neutral",
        next: "assistant_finish",
      },
      assistant_finish: {
        speaker: "assistant",
        emotion: "neutral",
        next: "manager_leaves",
      },
      manager_leaves: {
        type: "presence",
        action: "leave",
        char: "manager",
        next: "assistant_finish_player",
      },
      assistant_finish_player: {
        speaker: "assistant",
        emotion: "explaining",
        next: null,
      },
    },
  },

  // Briefing antes do desafio "pattern-recognition" (padrão: pre-<gameId>)
  // TODO(história): hoje esta cena é compartilhada pelas Etapas 1, 2 e 3 (ver
  // progressionConfig.js). Vamos removê-la das etapas seguintes OU criar novas
  // histórias de clientes para narrar cada novo desafio.
  "pre-pattern-recognition": {
    start: "briefing",
    header: true,
    nodes: {
      briefing: {
        speaker: "assistant",
        emotion: "neutral",
        next: "client_call",
      },
      client_call: {
        speaker: "taskGiver01",
        emotion: "neutral",
        forwarded: true, // a Malu está relendo a mensagem da cliente
        next: "analysis",
      },
      analysis: {
        speaker: "assistant",
        emotion: "explaining",
        next: "former_it",
      },
      former_it: {
        speaker: "assistant",
        emotion: "neutral",
        next: "notes_handoff",
      },
      notes_handoff: {
        speaker: "assistant",
        emotion: "explaining",
        next: "rardi_notes",
      },
      rardi_notes: {
        type: "notes",
        notes: ["rotation", "repeat", "instructions", "rule"],
        next: null,
      },
    },
  },

  // Cutscene pós-conclusão da Etapa 1
  "post-pattern-recognition-1": {
    start: "client_thanks",
    nodes: {
      client_thanks: {
        speaker: "taskGiver01",
        emotion: "neutral",
        next: "assistant_praise",
      },
      assistant_praise: {
        speaker: "assistant",
        emotion: "explaining",
        next: "manager_feedback",
      },
      manager_feedback: {
        speaker: "manager",
        emotion: "explaining",
        choices: [
          { id: "choiceContinue", next: "manager_reply" },
          { id: "choiceHumble", next: "manager_reply" },
        ],
      },
      manager_reply: {
        speaker: "manager",
        emotion: "neutral",
        next: "assistant_dashboard",
      },
      assistant_dashboard: {
        speaker: "assistant",
        emotion: "explaining",
        next: null,
      },
    },
  },

  // Cutscene pós-conclusão da Etapa 2
  "post-pattern-recognition-2": {
    start: "manager_eval",
    nodes: {
      manager_eval: {
        speaker: "manager",
        emotion: "explaining",
        next: "assistant_celebrate",
      },
      assistant_celebrate: {
        speaker: "assistant",
        emotion: "explaining",
        next: null,
      },
    },
  },
};
