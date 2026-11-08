# Sistema de Tutoriais Interativos Just-in-Time (Onboarding Lógico)

Este documento descreve a arquitetura, o design didático e os padrões de extensão para o **Sistema de Tutoriais Interativos Just-in-Time** do projeto `ic_game`.

---

## 1. Objetivo e Filosofia de Design ("Slow-Paced Onboarding")

Em jogos lógicos e de treinamento cognitivo, lançar o jogador diretamente em desafios de alta cadência sem uma ancoragem prática prévia gera frustração ou faz o usuário depender de tentativa-e-erro em vez de raciocínio espacial dedutivo.

O sistema adota a filosofia de **Onboarding Just-in-Time**:

- O tutorial não acontece todo de uma vez no início do jogo ("infodump").
- O tutorial é acionado **imediatamente antes da primeira fase que introduz um novo conceito ou operador espacial** (ex.: rotação horária na Fase 1, anti-horária na Fase 2, espelhamento horizontal na Fase 12, espelhamento vertical na Fase 14).
- O jogador **interage ativamente com a mecânica** antes de resolver o puzzle de cabeça.

---

## 2. A Metáfora Visual: O Estúdio de Desenho e Criação de Sprites

Para ensinar conceitos abstratos como eixos cartesianos e transformações afins, o sistema utiliza uma metáfora familiar e intuitiva: **aplicativos de desenho, arte digital e editores de imagem**.

No mundo real da arte digital e do gamedev:

- **Espelhar Horizontalmente (Flip H):** É usado rotineiramente para desenhar metade de um personagem ou objeto simétrico e duplicá-lo para a outra metade, invertendo a esquerda e a direita ao longo de um eixo vertical.
- **Espelhar Verticalmente (Flip V):** É usado para criar reflexos em poças d'água, chão de vidro ou sombras projetadas, invertendo o topo e a base ao longo de um eixo horizontal.
- **Rotacionar (CW / CCW 90°):** É usado para reorientar objetos ortogonalmente.

O tutorial simula essa janela de ferramentas com layout **Mobile-First** (canvas amplo no topo e ferramentas ergonômicas embaixo) utilizando o asset visual `ic_game/src/assets/images/spritepaint.png`. Uma vez que o jogador clica na ferramenta e vê a transformação ocorrer fisicamente, a explicação didática fixa o conceito:

> _"Em aplicativos de desenho, usamos o espelho para criar simetria automaticamente. Nos servidores da empresa, você fará exatamente esse cálculo mentalmente para encontrar o bloco certo!"_

---

## 3. Arquitetura Modular

A arquitetura é dividida em 4 camadas desacopladas:

```
src/
├── game/
│   └── data/
│       ├── tutorialsConfig.js          # Camada 1: Declaração pura dos tutoriais e gatilhos
│       └── tutorialsConfig.test.js     # Testes unitários de validação das regras
├── stores/
│   └── progression.js                  # Camada 2: Persistência do array completedTutorialIds
├── components/
│   └── tutorials/
│       └── InteractiveTutorialModal.vue # Camada 3: Modal retrô interativo com manipulação tátil
├── composables/
│   └── useTutorialTrigger.js           # Camada 4: Hook de detecção e disparo no ciclo de vida
└── locales/
    └── pt-BR.json                      # Strings e explicações didáticas em i18n
```

### 3.1. Declaração do Tutorial (`tutorialsConfig.js`)

Cada tutorial é registrado como um objeto imutável:

```javascript
export const TUTORIALS_CONFIG = Object.freeze({
  rotation_cw: {
    id: "rotation_cw",
    gameId: "pattern-recognition",
    triggerLevel: 1,
    interactionType: "rotate_cw",
    shape: "spritepaint",
    titleKey: "tutorials.rotation_cw.title",
    instructionKey: "tutorials.rotation_cw.instruction",
    explanationKey: "tutorials.rotation_cw.explanation",
  },
  flip_h: {
    id: "flip_h",
    gameId: "pattern-recognition",
    triggerLevel: 12,
    interactionType: "flip_h",
    shape: "spritepaint",
    titleKey: "tutorials.flip_h.title",
    instructionKey: "tutorials.flip_h.instruction",
    explanationKey: "tutorials.flip_h.explanation",
  },
  // ...
});
```

### 3.2. Persistência na Store (`progression.js`)

- `completedTutorialIds`: array de IDs concluídos persistidos no `localStorage`.
- `isTutorialCompleted(id)`: retorna se o tutorial já foi feito.
- `markTutorialCompleted(id)`: registra a conclusão.

### 3.3. Integração nos Jogos (`useTutorialTrigger.js`)

O minigame (`PatternRecognitionGame.vue`) não precisa gerenciar regras de tutorial. Ele apenas consome o hook:

```javascript
const { activeTutorial, completeActiveTutorial } = useTutorialTrigger({
  gameId: "pattern-recognition",
  currentLevel,
});
```

Quando `activeTutorial` está definido, o componente renderiza o `<InteractiveTutorialModal />`. Ao concluir, o hook avança e o jogo inicia normalmente.

---

## 4. Guia de Extensão: Como Adicionar um Novo Tutorial

1. **Definir no Config:** Adicione o novo objeto em `src/game/data/tutorialsConfig.js` com o `gameId`, `triggerLevel` e tipo de interação.
2. **Adicionar Textos:** Insira as traduções em `src/locales/pt-BR.json` sob a chave `tutorials.<id>`.
3. **Validar com Teste:** Execute `npm test` para assegurar que o novo tutorial possui integridade de chaves e dados.
