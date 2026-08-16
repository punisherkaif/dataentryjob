# Phase 5: Polish, Security & Deployment Verification Guide

This guide details the final polish, security hardening, and deployment readiness checks for the **Data Entry Work Management Platform**.

---

## 1. Responsive & Mobile Verification (`~375px`, `~768px`, `1440px+`)

Every page in the application has been verified for mobile responsiveness:
- **Zero Horizontal Scrolling**: Container widths and tables use overflow protection and responsive cards.
- **Mobile Navigation**: On screens `< 1024px`, the left sidebar converts into an accessible drawer with a hamburger menu button.
- **Touch Target Sizing**: All form submit buttons, table row actions, image zoom triggers, and modal buttons have comfortable touch areas.
- **Mobile Tables & Lists**:
  - `/admin/registrations`: Desktop table &rarr; Mobile card list with review modal.
  - `/admin/tasks`: Desktop table &rarr; Mobile card list.
  - `/admin/submissions`: Desktop table &rarr; Mobile card list with review modal.
  - `/user/tasks`: Desktop table &rarr; Mobile card list.
  - `/user/submissions`: Desktop table &rarr; Mobile card list.
- **Image Resizing**: Source images resize dynamically with native touch zoom.

---

## 2. Shared Status Badges & Form UX Polish

1. **Shared Status Badge Component** ([`components/ui/StatusBadge.tsx`](file:///d:/Github/Testing%20projects/dataentryjob/components/ui/StatusBadge.tsx)):
   - Shared across all pages for consistent color coding:
     - **Pending**: Yellow / Amber (`bg-amber-500/10 text-amber-400`)
     - **In Progress**: Blue (`bg-blue-500/10 text-blue-400`)
     - **Submitted / Under Review**: Purple (`bg-purple-500/10 text-purple-400`)
     - **Passed / Active / Approved**: Green (`bg-emerald-500/10 text-emerald-400`)
     - **Failed / Rejected / Suspended**: Red (`bg-rose-500/10 text-rose-400`)
2. **Double-Submit Prevention**:
   - Every action button across Login, Register, Task Creation, Work Submission, and Review displays a spinning loader and is disabled while requests are in flight.

---

## 3. Centralized Application Configuration

All configurable values are centralized in [`config/app.config.ts`](file:///d:/Github/Testing%20projects/dataentryjob/config/app.config.ts):
- `UPI ID`: Configurable via `NEXT_PUBLIC_UPI_ID` (Default: `dataentrywork@upi`)
- `Registration Fee`: Configurable via `NEXT_PUBLIC_REGISTRATION_FEE` (Default: `500.00`)
- `QR Code`: Configurable via `NEXT_PUBLIC_QR_CODE_URL` (Default: `/qr-placeholder.png`)

---

## 4. Security & Role Isolation Verification

1. **Server-Side Role Checks**: Every admin server action (`admin-registration.ts`, `tasks.ts`, `submissions.ts`) validates `authUser` and enforces `role === 'ADMIN'` on the server before mutating data.
2. **Account Status Middleware**: Any account with status `PENDING`, `REJECTED`, or `SUSPENDED` is intercepted by `lib/supabase/middleware.ts` and redirected to `/account-status`.
3. **Database RLS Policies**: Row Level Security policies enforce data isolation on Supabase tables:
   - Workers can only view tasks assigned to their `auth.uid()`.
   - Workers cannot view or mutate other workers' submissions or tasks.
4. **Upload Validation**: Image and ZIP uploads enforce file mime-type checking and size limits (10MB for images, 100MB for ZIP packages).

---

## 5. Deployment Readiness

1. **Clean Production Build**: Run `npm run build` locally to verify zero build or compilation errors.
2. **Git Hygiene**: `.env.local` and credentials are gitignored.
3. **Deployment Documentation**: Follow [`docs/DEPLOYMENT_GUIDE.md`](file:///d:/Github/Testing%20projects/dataentryjob/docs/DEPLOYMENT_GUIDE.md) for step-by-step Vercel deployment instructions.
