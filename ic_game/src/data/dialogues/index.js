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
        emotion: "explaining",
        next: null,
      },
    },
  },

  // Briefing antes do desafio "pattern-recognition" (padrão: pre-<gameId>)
  "pre-pattern-recognition": {
    start: "briefing",
    nodes: {
      briefing: {
        speaker: "assistant",
        emotion: "neutral",
        next: "client_call",
      },
      client_call: {
        speaker: "taskGiver01",
        emotion: "neutral",
        next: "analysis",
      },
      analysis: { speaker: "assistant", emotion: "explaining", next: "tip" },
      tip: { speaker: "assistant", emotion: "explaining", next: null },
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
