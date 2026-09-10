### ATENÇÃO DEV, AQUI NA DATA 10/09/2026 AINDA NÃO ESTAMOS COM O PRISMA CONFIGURADO PODE PULAR PARA
### O FINAL DO ARQUIVO NO RESUMO E SÓ RODAR OS GIT PULL, NPM INSTALL, IGNORAR OS COMANDOS PRISMA AGORA
### RECOMENDO DEIXAR 3 TERMINAIS DO TIPO GIT BASH NO VSCODE: 
### 1 PARA OS COMANDOS GIT
### 2 PARA ENTRAR NA PASTA IC_GAME (FRONT)
### 3 PARA ENTRAR NA PASTA BACKEND (BACK)

# Setup e Padrões do Back-end

Este documento detalha as boas práticas e o fluxo de trabalho do back-end (Node.js + Express + Prisma) para garantir que o projeto rode perfeitamente em qualquer máquina (evitando o famoso "na minha máquina funciona") e facilite o deploy no futuro, sem a necessidade imediata de Docker.

## 1. Controle de Versão do Node (`.nvmrc`)

Para garantir que todos os desenvolvedores estejam usando a mesma versão do Node.js, utilizamos um arquivo `.nvmrc` na raiz do projeto.

**Como usar:**
Se você utiliza o **NVM** (Node Version Manager), basta abrir o terminal na pasta do projeto e rodar:

```bash
nvm use
```

_Isso fará o seu terminal adotar a versão exata exigida pelo projeto._

## 2. Padrões de Variáveis de Ambiente (`.env`)

Arquivos `.env` contêm informações sensíveis (como URLs e senhas de banco de dados) e **nunca** devem ser commitados no Git (já estão no `.gitignore`).

Para que os outros desenvolvedores saibam quais variáveis precisam ser configuradas:

1. Sempre mantenha o arquivo `.env.example` atualizado com as chaves (sem as senhas reais).
2. Ao baixar o projeto, cada dev deve duplicar o `.env.example`, renomear para `.env` e preencher com seus dados locais.

Exemplo de `.env.example`:

```text
PORT=3000
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ic_game_db"
```

## 3. Fluxo de Banco de Dados (Prisma)

O banco de dados é a maior fonte de erros entre diferentes ambientes. Usamos o Prisma para padronizar isso:

- **Migrations (`npx prisma migrate dev`):** Toda vez que a modelagem do banco (`schema.prisma`) for alterada, uma _migration_ é gerada. Ao baixar o projeto, os outros devs rodam o comando de migração para que o Prisma sincronize a estrutura do banco local deles com a versão mais recente.
- **Seeds (`npx prisma db seed`):** O arquivo `seed.ts` é responsável por popular o banco com dados iniciais e falsos para testes (ex: usuários de teste, itens iniciais). Isso garante que o desenvolvedor já tenha dados para trabalhar assim que rodar o projeto.

---

## 🚀 Resumo: Fluxo do Novo Desenvolvedor

Se você acabou de clonar o projeto, siga estes passos para rodar o Back-end perfeitamente na sua máquina:

1. **Baixe as atualizações:**
   ```bash
   git pull
   ```
2. **Instale as dependências:**
   ```bash
   cd backend
   npm install
   ```
3. **Configure as Variáveis de Ambiente:**
   - Copie o arquivo `.env.example` e renomeie a cópia para `.env`.
   - Configure a `DATABASE_URL` no `.env` para apontar para o seu Postgres local.
4. **Sincronize o Banco de Dados:**
   ```bash
   npx prisma migrate dev
   ```
   _(Este comando cria as tabelas no seu banco local)_
5. **Rode o servidor:**
   ```bash
   npm run dev
   ```
