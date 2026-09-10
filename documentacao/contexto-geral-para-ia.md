# Contexto Geral do Projeto para IA e Desenvolvedores

Este documento serve como ponto de partida e contexto geral para agentes de IA e novos desenvolvedores que venham a trabalhar no projeto. Ele descreve o estado atual da aplicação, a stack tecnológica escolhida, a estrutura do repositório, as metas de arquitetura e o fluxo de trabalho definido.

## Estado Atual do Projeto e Estrutura

O projeto adota uma arquitetura separada em duas frentes dentro do mesmo repositório, garantindo a organização modular. Não é um "monorepo" configurado com workspaces, mas sim dois projetos independentes no mesmo repositório:

- **Front-end (`ic_game/`)**: Configurado com **Vue 3**, **Vite** e **Phaser**. A estrutura não é apenas de um jogo único, mas atua como um "Hub", preparado para abrigar uma **coleção de mini-jogos/fases independentes** (ex: Logic Lab, Pattern Recognition, Matrix Mirror, Charades).
- **Back-end (`backend/`)**: Estruturado com Node.js, Express e Prisma. Já possui uma rota de teste (`/api/test`) configurada com CORS para validar a comunicação com o front-end.
- **Integração Básica**: O front-end e o back-end já estão conectados. O `TestGame.vue` executa uma verificação de status (ping) na API do back-end, exibindo os resultados em tempo real dentro do Canvas do jogo.

## Stack Tecnológica Definida

### Front-end

- **Vue.js**: Framework reativo para construção das interfaces do usuário (menus, HUDs).
- **Phaser**: Framework HTML5 focado na física e renderização gráfica 2D dos jogos, integrado ao Vue.
- **Vite**: Ferramenta de build e servidor de desenvolvimento otimizado e super rápido.

### Back-end

- **Node.js**: Ambiente de execução javascript (utilizando a versão 20 fixada via `.nvmrc`).
- **Express**: Framework web minimalista para rotas, middlewares e APIs.
- **Prisma ORM**: ORM moderno e tipado para interações com o banco de dados.
- **TypeScript**: Utilizado no Back-end para garantir segurança de tipagem e padronização.
- **Banco de Dados**: **PostgreSQL** (definido para uso com o Prisma).

## Metas de Qualidade e Arquitetura

O estado atual do código deve evoluir buscando sempre:

- **Qualidade de Código**: Foco em estruturar melhor a aplicação em módulos, seguindo princípios fundamentais como **SOLID** e **DRY** (Don't Repeat Yourself).
- **Escalabilidade da API**: O backend está dividido em `routes`, `controllers`, `services`, `middlewares` e `utils` para garantir clareza e manutenção simples.
- **Modularidade de Jogos**: Como o projeto terá múltiplas fases independentes, a estrutura de pastas e a injeção de dependências devem favorecer o reaproveitamento de lógicas, componentes visuais e estilos.

## Fluxo de Trabalho e Padrões

A gestão do banco de dados será fortemente baseada em **Code-First** com o Prisma. Para evitar conflitos entre desenvolvedores ("na minha máquina funciona"), adotamos algumas regras essenciais:

1. **Modelagem Prévia**: O processo se inicia com a elaboração de diagramas de banco de dados, que servirão de base para construir as tabelas no Prisma.
2. **Migrations**: Qualquer mudança de campo, adição de tabelas ou alteração no banco será feita exclusivamente via _Migrations_ do Prisma. Isso garante que a evolução do banco seja rastreável e versionável (via commits no Git).
3. **Seeds**: Serão utilizados arquivos de _Seeds_ do Prisma para plantar dados iniciais no banco de dados automaticamente, facilitando o ambiente de desenvolvimento.
4. **Ambientes (Node e Env)**: Exigimos o uso do arquivo `.nvmrc` para unificar a versão do Node. Credenciais de banco jamais sobem ao repositório, o desenvolvedor deve se orientar pelo arquivo `.env.example`.

> [!TIP]
> Para o passo a passo exato de como rodar e configurar o Back-end pela primeira vez, consulte o documento: [Setup e Padrões do Back-end](./backend_setup_e_padroes.md).

## Identidade Visual e Wireframes

> [!NOTE]
> **Placeholder de Identidade Visual**
>
> _Uma identidade visual e um wireframe estão sendo desenvolvidos para padronizar o projeto._
> _[Espaço reservado para inclusão do link/imagens do wireframe e guia de estilos no futuro]_

O objetivo do wireframe será guiar todo o desenvolvimento das interfaces, garantindo consistência no layout e nas transições de telas e menus, antes da implementação gráfica final dos mini-jogos.
