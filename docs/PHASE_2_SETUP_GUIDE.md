# Phase 2: Supabase Storage & Registration Approval Setup Guide

This step-by-step guide will walk you through applying the Phase 2 Storage & RLS setup, testing public user registration with manual UPI payment details, approving registrations from the Admin panel, and verifying worker access.

---

## 1. Apply Phase 2 Supabase Migrations

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and click on **SQL Editor**.
2. Click **New Query**.
3. Copy and paste the contents of [`supabase/migrations/20260816000001_phase2_storage.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260816000001_phase2_storage.sql) into the SQL Editor and click **Run**.
4. Create another **New Query**.
5. Copy and paste the contents of [`supabase/migrations/20260816000002_fix_registration_rls.sql`](file:///d:/Github/Testing%20projects/dataentryjob/supabase/migrations/20260816000002_fix_registration_rls.sql) into the SQL Editor and click **Run**.

> **What these do:**
> - `20260816000001_phase2_storage.sql`: Creates the `payment-screenshots` bucket in Supabase Storage with public upload & select policies.
> - `20260816000002_fix_registration_rls.sql`: Permits public unauthenticated user registration submissions into `registrations`, `users`, and `activity_logs` tables without being blocked by Row Level Security (RLS).

---

## 2. Public User Registration Walkthrough (`/register`)

1. Start your local development server if not already running:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000/register`.
3. Complete the registration form:
   - **Full Name**: `Jane Worker`
   - **Email**: `janeworker@example.com`
   - **Mobile Number**: `9876543210`
   - **Username**: `janeworker`
   - **Password**: `janepass123`
   - **Confirm Password**: `janepass123`
4. In the **Manual UPI Payment** section:
   - Observe the QR Code & UPI ID (`dataentrywork@upi`).
   - Enter **Transaction ID / UTR Number**: `UPI9876543210`
   - (Optional) Upload a payment screenshot image.
5. Click **Submit & Request Approval**.
6. **Expected Result**: You are shown the "Registration Submitted! Status: PENDING ADMIN APPROVAL" confirmation view. You are **not** logged in automatically.

---

## 3. Admin Registration Approval Walkthrough (`/admin/registrations`)

1. Open a new browser window or tab and go to `http://localhost:3000/login`.
2. Sign in with your Admin credentials: `admin@example.com` / `admin123456`.
3. Lands on `/admin/dashboard`. Notice:
   - **Pending Registrations** stat card shows `1` (or count of pending requests).
   - **Recent System Activity** feed lists `REGISTRATION_SUBMITTED` event for `Jane Worker`.
4. Click **Review Registrations** or navigate to `http://localhost:3000/admin/registrations`.
5. Observe the pending registration request in the list:
   - **Desktop (1440px)**: Table view showing Name, Email, Username `@janeworker`, Transaction ID `UPI9876543210`, Amount `₹500.00`, Status `Pending Review`.
   - **Mobile (375px)**: Responsive card list.
6. Click on the row/card to open the **Registration Review Modal**.
7. Review user details, transaction ID, and optional payment screenshot link.
8. Click **Approve Registration**.
9. **Expected Result**: Status updates to `APPROVED`, notification appears, and the event `REGISTRATION_APPROVED` is logged to `activity_logs`.

---

## 4. Verify Worker Login Post-Approval

1. Open `http://localhost:3000/login`.
2. Sign in with newly approved user credentials:
   - **Email/Username**: `janeworker@example.com` (or `janeworker`)
   - **Password**: `janepass123`
3. Click **Sign In**.
4. **Expected Result**: Successfully logs in and lands on `/user/dashboard` with Worker badge!

---

## 5. Testing Registration Rejection (Optional)

1. Register another test user at `http://localhost:3000/register` with Transaction ID `FAKE0000`.
2. Log in as Admin -> `/admin/registrations`.
3. Open the detail modal for `FAKE0000` -> enter optional rejection note -> click **Reject Registration**.
4. Attempt to log in with the rejected account -> automatically redirected to `/account-status` displaying "Account Registration Rejected".

---

## 6. Ready for Phase 3!

You have completed Phase 2 verification!
