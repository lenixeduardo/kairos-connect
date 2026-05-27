# Fix: Render Deploy Hanging After Seed

## Objetivo
Corrigir falha de deploy no Render onde o processo de seed não finalizava, travando o build, e onde o servidor subia na porta errada (3333 em vez da porta injetada pelo Render).

---

## Root Cause Analysis

### Bug 1 — Seed não terminava (processo travado)
`backend/seed.js` usava `await` no top-level (ESM) para fazer hash com bcrypt, mas ao final do script **não chamava `process.exit(0)`**. O módulo `better-sqlite3` mantém handles nativos no event loop, impedindo o processo Node.js de encerrar naturalmente. Resultado: o deploy ficava preso indefinidamente.

### Bug 2 — PORT incorreta (server em contexto de build)
O Render injeta `process.env.PORT` **somente na fase de START**, não na fase de BUILD. A configuração anterior rodava `node backend/server.js` sem um `render.yaml` explícito, o que fazia o servidor iniciar no contexto de build sem `PORT` → fallback para `3333`. O Render não conseguia fazer health check na porta esperada (ex: 10000) → timeout de 18 min → deploy falhou.

### Bug 3 — Senha do admin incorreta
Seed criava admin com senha `'admin'`, mas o sistema esperava `'admin1'`.

---

## Decisões Técnicas

### `render.yaml` adicionado
```yaml
services:
  - type: web
    name: maintech-backend
    env: node
    rootDir: backend
    buildCommand: npm install
    startCommand: node seed.js && node server.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
```

- `rootDir: backend` → todos os comandos rodam dentro de `backend/`
- `buildCommand: npm install` → APENAS instala deps (não inicia servidor)
- `startCommand: node seed.js && node server.js` → seed roda primeiro (idempotente), depois server com `process.env.PORT` do Render
- `healthCheckPath: /health` → endpoint dedicado que retorna 200

### `backend/seed.js` — `process.exit(0)` adicionado
```js
// final do arquivo
process.exit(0);
```
Garante encerramento limpo do processo após seed, mesmo com native bindings do `better-sqlite3`.

### `backend/server.js` — endpoint `/health` adicionado
```js
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
```
Permite que o Render verifique a saúde do serviço sem autenticação → deploy completa.

### Senha admin atualizada
```js
{ email: 'admin@admin.com', password: 'admin1', ... }
```

---

## Fluxo de Deploy Correto (pós-fix)

```
Render BUILD
  └── npm install  (deps instaladas)

Render START
  ├── node seed.js  →  DB seeded (ou skip se já existir)  →  process.exit(0)
  └── node server.js  →  app.listen(process.env.PORT)
        └── GET /health → 200 OK  ← Render health check passa
```

---

## Possíveis Melhorias

- **Persistent Disk**: configurar Render Disk para o path `backend/kairos.db` — evita re-seed a cada deploy e preserva dados entre reinicializações
- **Migração de DB**: implementar sistema de migrations (ex: `better-sqlite3-migrations`) em vez de `CREATE TABLE IF NOT EXISTS`
- **Health check mais rico**: incluir status do DB no endpoint `/health` (`db.prepare('SELECT 1').get()`)
- **Variáveis de ambiente**: mover `JWT_SECRET` para variável de ambiente real no Render (não usar o default hardcoded)
- **Logs estruturados**: usar `pino` ou similar para logs em JSON, facilitando parsing no Render
