# Contexto Geral do Projeto para IA

Este documento serve como ponto de partida e contexto geral para agentes de IA que venham a trabalhar no projeto. Ele descreve o estado atual da aplicação, a stack tecnológica escolhida, as metas de arquitetura e qualidade de código, e o fluxo de trabalho definido.

## Estado Atual do Projeto

- Atualmente, o projeto possui a estrutura inicial do front-end localizada na pasta `ic_game/`.
- O setup atual do front-end conta com **Vue 3** e **Vite** configurados, com os componentes e estilos iniciais.
- Existe uma documentação inicial em `documentacao/`.

## Stack Tecnológica Definida

### Front-end

- **Vue.js**: Framework reativo para construção das interfaces do usuário.
- **Phaser**: Framework para o desenvolvimento do jogo em si (integrado ao Vue).
- **Vite**: Ferramenta de build e servidor de desenvolvimento super rápido.

### Back-end

- **Node.js**: Ambiente de execução.
- **Express**: Framework web minimalista para rotas e APIs.
- **Prisma ORM**: Ferramenta para gerenciar o banco de dados via código.
- **Banco de Dados**: **PostgreSQL** (definido para uso com o Prisma).

## Metas de Qualidade e Arquitetura

O estado atual do código não é o final. As próximas etapas envolvem melhorias significativas na estrutura:

- **Qualidade de Código**: Foco em estruturar melhor a aplicação em módulos, seguindo princípios fundamentais como **SOLID** e **DRY** (Don't Repeat Yourself).
- **Escalabilidade**: A estrutura modular visa facilitar a adição e manipulação de novas fases do jogo e promover o reaproveitamento de componentes e itens no layout futuro do jogo.

## Fluxo de Trabalho de Banco de Dados

A gestão do banco de dados será fortemente baseada em **Code-First** com o Prisma:

1. **Modelagem Prévia**: O processo se inicia com a elaboração de diagramas de banco de dados, que servirão de base para construir as tabelas no Prisma.
2. **Migrations**: Qualquer mudança de campo, adição de tabelas ou alteração no banco será feita exclusivamente via _Migrations_ do Prisma. Isso garante que a evolução do banco seja rastreável e versionável (via commits no Git).
3. **Seeds**: Serão utilizados arquivos de _Seeds_ do Prisma para plantar dados iniciais no banco de dados automaticamente, facilitando o ambiente de desenvolvimento.

## Identidade Visual e Wireframes

> [!NOTE]
> **Placeholder de Identidade Visual**
>
> _Uma identidade visual e um wireframe estão sendo desenvolvidos para padronizar o projeto._
> _[Espaço reservado para inclusão do link/imagens do wireframe e guia de estilos no futuro]_

O objetivo do wireframe será guiar todo o desenvolvimento das interfaces, garantindo consistência no layout do projeto antes da implementação das fases finais.
