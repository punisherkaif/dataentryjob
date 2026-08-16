# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A responsive web-based work management platform for a data-entry/typing business. Facilitates manual UPI registration approval, admin task creation with source images, worker submissions via external Google Drive links, and admin pass/fail verification cycles.

## Goals
1. User registration with manual UPI payment verification (Transaction ID + screenshot) and admin approval flow.
2. Admin task management: Create tasks, attach source image files (scans/photos), assign to workers.
3. Worker workflow: View assigned tasks, access source images, submit external Google Drive links.
4. Review workflow: Admin inspects submitted links, approves (PASSED) or rejects (FAILED with reason), allowing worker resubmission if enabled.
5. Secure role-based access control (ADMIN vs USER/Worker) with server-side checks and Supabase Row Level Security (RLS).

## Non-Goals (Out of Scope for V1)
- No AI or OCR of any kind.
- No automatic document checking or comparison.
- No payment gateway API integration (100% manual payment via QR code + transaction ID).
- No Google Drive API integration (plain text URL storage only).
- No chat system or real-time collaboration.
- No email or WhatsApp automation.
- No native mobile app (responsive web only).
- No complex analytics.
- No microservices or separate backend service.
- No roles beyond ADMIN and USER.

## Tech Stack
- **Framework**: Next.js (App Router) + TypeScript (Frontend + Backend)
- **Styling**: Tailwind CSS
- **Database & Auth & Storage**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Validation**: Zod
- **Form Management**: React Hook Form
- **Icons**: Lucide React
- **Deployment**: Vercel

## Users & Roles
- **Admin**: Manages user registration approvals, creates tasks, uploads source images, inspects submitted links, marks Pass/Fail.
- **Worker (USER)**: Registers via UPI payment flow, views assigned tasks, views source images, submits Google Drive link, resubmits if failed and permitted.

## Responsive Design Rules
- Single web app codebase adapting across viewports:
  - **Desktop (1200px+)**: Sidebar navigation, data tables, multi-column layouts.
  - **Mobile (320px+)**: Hamburger menu, single column layout, card lists, large tap targets, no horizontal scroll.

## Security Baseline
- Supabase Auth built-in password hashing.
- Server-side role checks on all API endpoints/Server Actions and protected routes.
- Strict data isolation: Workers can only view/modify their own tasks/submissions.
- Full route protection for Admin dashboard/actions.
