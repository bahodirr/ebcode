# ebcode

Full-stack AI development platform powered by **Turborepo**, **Bun**, **Next.js**, and **Hono**.

## Quick Start

### 1. Prerequisites
- **Bun** (v1.0+)
- **E2B API Key** (for backend sandboxes)

### 2. Setup
Install dependencies:
```bash
bun install
```

### 3. Environment Variables
Create `.env` files in the respective directories:

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend** (`apps/backend/.env`):
```env
E2B_API_KEY=your_e2b_api_key
PORT=3001
```

### 4. Run
Start the development server:
```bash
bun run dev
```

- **Web**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)

## Commands
- `bun run build` - Build all packages
- `bun run check-types` - Run type checks
- `bun run format` - Format code
