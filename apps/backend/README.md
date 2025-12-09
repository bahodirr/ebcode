# backend (Hono + Bun)

Hono server running on Bun.

## Install

```bash
bun install
```

## Develop

```bash
# hot-reload
bun run dev
```

## Build & Start

```bash
bun run build
bun run start
```

## Endpoints (frontend quick reference)

- `GET /health` — liveness check, returns `"ok"`.
- `POST /api/projects/:projectId/init` — create or reuse a sandbox for the project. Body: `{ sandboxId?, githubUrl?, initScript?, devScript?, processName? }`. Response: `{ projectId, sandboxId, previewUrl, agentUrl }` where `agentUrl` is the OpenCode agent base URL (port 4096).
- `GET /api/projects/:projectId/:sandboxId` — fetch sandbox info. Response: `{ projectId, sandboxId, previewUrl, agentUrl }`.
- `POST /api/projects/:projectId/:sandboxId/resume` — ensure dev/agent processes are running again. Body: `{ devScript?, processName? }`. Response: `{ projectId, sandboxId, previewUrl, agentUrl }`.
- `ALL /api/agent/:projectId/:sandboxId/*` — proxies any method/path to the sandboxed OpenCode agent (port 4096). Use this to talk to the agent; paths after the wildcard are forwarded as-is.

Server runs on `PORT` (defaults to `3000`).
