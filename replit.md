# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Exam Brain (`artifacts/exam-brain`)
- React + Vite frontend at `/`
- Dark UI with animated CSS/SVG student character, floating thought bubbles (framer-motion), upload area
- Pages: `/` (home with student + upload), `/results` (analysis results with topics, bar chart, study plan, Last Night Mode)
- Uses `@react-three/fiber` + `@react-three/drei` installed but student rendered in pure CSS/SVG for compatibility

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Routes: `GET /api/healthz`, `POST /api/upload`, `POST /api/analyze`
- Upload: multer (memory storage), supports PDF (pdf-parse) and images (up to 10 files)
- Analyze: keyword/topic extraction from text, frequency scoring, study plan generation
- In-memory session store (2hr TTL) for uploaded text

### Canvas (`artifacts/mockup-sandbox`)
- Design sandbox at `/__mockup`

## API Endpoints

- `GET /api/healthz` — health check
- `POST /api/upload` — multipart/form-data with `files[]`, returns `{ sessionId, filesProcessed, totalText, preview }`
- `POST /api/analyze` — JSON `{ sessionId?, text?, planDays?: 2|5 }`, returns full analysis with topics, studyPlan, thoughtBubbles, etc.
