# DECISIONS.md — Architecture Decision Records

## ADR-001: Tech Stack & Architecture Baseline
- **Date**: 2026-08-16
- **Status**: Accepted
- **Context**: Need a responsive work management system for data entry tasks.
- **Decision**: Next.js App Router (TypeScript) with Tailwind CSS, Supabase (Postgres, Auth, Storage), Zod, React Hook Form, and Lucide React.
- **Consequences**: Single codebase deployed to Vercel, unified frontend and backend API/Server Actions, strict server-side role check enforcement and Supabase RLS.
