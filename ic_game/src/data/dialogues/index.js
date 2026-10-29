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
 *   branch     – bifurcação condicional síncrona. Campos: branch: ({ stars, story }) => nextNodeId
 *   transition  – fade out na tela com efeito sonoro, texto e limpeza de chat. Campos: effects, duration, overlayTextKey, clearChat, next
 *   placeholder – tela com sprite e badge de placeholder para fases em desenvolvimento. Campos: image, next
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

  // Briefing da Etapa 2 (Placeholder com spritepaint.png)
  "pre-pattern-recognition-2": {
    start: "stage_placeholder",
    nodes: {
      stage_placeholder: {
        type: "placeholder",
        image: "spritepaint",
        next: null,
      },
    },
  },

  // Cutscene pós-conclusão da Etapa 1
  "post-pattern-recognition-1": {
    start: "client_thanks",
    header: true,
    nodes: {
      client_thanks: {
        speaker: "taskGiver01",
        emotion: "neutral",
        next: "client_leaves",
      },
      client_leaves: {
        type: "presence",
        action: "leave",
        char: "taskGiver01",
        next: "assistant_praise_branch",
      },
      assistant_praise_branch: {
        type: "branch",
        branch: ({ stars }) => {
          if (stars === 3) return "assistant_praise_3stars";
          if (stars === 2) return "assistant_praise_2stars";
          return "assistant_praise_1star";
        },
      },
      assistant_praise_3stars: {
        speaker: "assistant",
        emotion: "explaining",
        next: "manager_joins",
      },
      assistant_praise_2stars: {
        speaker: "assistant",
        emotion: "explaining",
        next: "manager_joins",
      },
      assistant_praise_1star: {
        speaker: "assistant",
        emotion: "explaining",
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
        next: "manager_whisper",
      },
      manager_whisper: {
        speaker: "manager",
        emotion: "neutral",
        next: "manager_leaves",
      },
      manager_leaves: {
        type: "presence",
        action: "leave",
        char: "manager",
        next: "assistant_reactions_1",
      },
      assistant_reactions_1: {
        speaker: "assistant",
        emotion: "explaining",
        next: "assistant_reactions_2",
      },
      assistant_reactions_2: {
        speaker: "assistant",
        emotion: "neutral",
        choices: [
          {
            id: "choiceContinueTask",
            next: "replyContinueTask",
            onSelect: ({ story }) =>
              story.recordDecision("stage2TimeOfDay", "night"),
          },
          {
            id: "choiceCallItADay",
            next: "replyCallItADay",
            onSelect: ({ story }) =>
              story.recordDecision("stage2TimeOfDay", "day"),
          },
        ],
      },
      replyContinueTask: {
        speaker: "assistant",
        emotion: "explaining",
        next: "transition_night",
      },
      transition_night: {
        type: "transition",
        effects: ["suspiciousSteps"],
        duration: 1200,
        next: "malu_night_scared",
      },
      malu_night_scared: {
        speaker: "assistant",
        emotion: "neutral",
        next: null,
      },
      replyCallItADay: {
        speaker: "assistant",
        emotion: "explaining",
        next: "transition_day",
      },
      transition_day: {
        type: "transition",
        effects: ["morningCock"],
        duration: 1800,
        overlayTextKey: "story.chat.day_2",
        clearChat: true,
        next: "malu_morning_greeting",
      },
      malu_morning_greeting: {
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
