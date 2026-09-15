# Internacionalização (i18n) e Gerenciamento de Strings

## Decisão Arquitetural

Para manter a base de código do Front-end limpa e facilitar futuras localizações do projeto, foi adotada a biblioteca **`vue-i18n`** como solução definitiva para o gerenciamento de strings da interface.

Esta arquitetura segue o mesmo princípio de isolamento de _resources_ utilizado no Android (`res/values/strings.xml`) e em frameworks modernos como o Moodle (pastas de idiomas isoladas).

## Por que não usar o Phaser para isso?

O Phaser é um motor 2D altamente focado em renderização e loop físico. Ele não dispõe de ferramentas sofisticadas para o parse, tradução ou pluralização de textos da interface (UI). Ao utilizarmos o `vue-i18n`, delegamos essa responsabilidade de texto e idiomas exclusivamente ao Vue, mantendo a responsabilidade estrutural separada da lógica do jogo.

## Como funciona?

Todos os textos visíveis ao usuário estão centralizados em um arquivo de dicionário JSON.
O idioma padrão do projeto é Português do Brasil: `ic_game/src/locales/pt-BR.json`

### Exemplo de Estrutura do Dicionário

```json
{
  "global": {
    "buttons": {
      "play": "Jogar"
    }
  },
  "home": {
    "welcome": "Bem-vindo(a) de volta"
  }
}
```

### Como utilizar no Vue (HTML)

Em vez de escrever textos diretamente ("chumbados") nos componentes `.vue`, utilize a função global de injeção `$t()`:

```vue
<!-- Evite isso -->
<button>Jogar</button>

<!-- Use isso -->
<button>{{ $t('global.buttons.play') }}</button>
```

### Como utilizar no JavaScript (Vue Script)

Caso precise do texto no lado lógico (setup), importe a instância instanciada no `main.js` ou use o hook `useI18n()` do Vue.

```javascript
import { useI18n } from "vue-i18n";
const { t } = useI18n();
console.log(t("home.welcome"));
```

## Próximos Passos (Expansão)

Conforme novos componentes, jogos Phaser e JSONs de dados (`games.json`) forem desenvolvidos, todo texto legível deverá ser transferido para esse dicionário modular. Quando chegar a hora de integrar a tradução dentro das _Scenes_ do Phaser, a própria instância global do `i18n` pode ser importada e lida dentro do canvas.
