# Backend (Hono + Bun)

This is the backend service for the Code Editor project. It is built with **Hono** running on **Bun**.

Its primary responsibility is to orchestrate **E2B Sandboxes**, which provide the isolated runtime environments for user projects and the AI agent.

## Prerequisites

- **Bun** (Latest version recommended)
- **E2B Account & API Key**: You need an API key from [E2B](https://e2b.dev/) to create and manage sandboxes.

## Environment Variables

Create a `.env` file in `apps/backend/` or ensure these variables are set in your environment:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `E2B_API_KEY` | **Required.** Your E2B API Key. | - |
| `PORT` | The port the server listens on. | `3000` |

## Scripts

### Install Dependencies

```bash
bun install
```

### Development

Run the server in hot-reload mode:

```bash
bun run dev
```

### Build & Start

Build the project for production and start the server:

```bash
bun run build
bun run start
```

### E2B Template Management

The backend includes scripts to build and deploy the custom E2B sandbox template used by the agent.

- **Build Development Template:**
  ```bash
  bun run e2b:build:dev
  ```

- **Build Production Template:**
  ```bash
  bun run e2b:build:prod
  ```

## API Reference

### Health Check

- **GET** `/health`
  - Returns `"ok"` if the server is running.

### Project Management

- **POST** `/api/projects/:projectId/init`
  - Initializes a new sandbox or connects to an existing one for a project.
  - **Body:**
    ```json
    {
      "sandboxId": "optional-existing-sandbox-id",
      "githubUrl": "optional-git-repo-url",
      "initScript": "npm install",
      "devScript": "npm run dev",
      "processName": "dev-server",
      "env": {
        "OPENAI_API_KEY": "...",
        "XAI_API_KEY": "..."
      }
    }
    ```
  - **Response:**
    ```json
    {
      "projectId": "...",
      "sandboxId": "...",
      "previewUrl": "https://...",
      "agentUrl": "https://..."
    }
    ```

- **GET** `/api/projects/:projectId/:sandboxId`
  - Retrieves information about an active sandbox.
  - **Response:** Same as init.

- **POST** `/api/projects/:projectId/:sandboxId/resume`
  - Resumes a paused project, ensuring the dev server and agent are running.
  - **Body:** Same as init (subset).

### Agent Proxy

- **ALL** `/api/agent/:projectId/:sandboxId/*`
  - Proxies requests to the `opencode` agent running inside the sandbox on port 4096.
  - The path suffix matches the agent's API routes.
