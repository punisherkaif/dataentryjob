# Phase 4: Submissions & Admin Review Workflow Guide

This step-by-step guide walks you through testing the complete **End-to-End Core Business Loop**: submitting work from Google Drive as a Worker, reviewing and rejecting with feedback as an Admin, resubmitting corrected work, and passing the final submission.

---

## 1. Prerequisites

Ensure your development server is running:
```bash
npm run dev
```

You should have:
1. An **Admin** user (e.g., `admin@example.com` / `admin123456`).
2. An **Active Worker** user (e.g., `janeworker@example.com` / `janepass123`).
3. At least one task assigned to the worker from Phase 3.

---

## 2. Worker Submits Work (`/user/tasks/[id]`)

1. Open your browser in an incognito window and sign in as the worker (`janeworker@example.com` / `janepass123`).
2. In the sidebar, click **Assigned Tasks** (`/user/tasks`) and open your assigned task.
3. If the task is `PENDING`, click **Start Task** to transition to `IN_PROGRESS`.
4. Scroll down to the **Submit Completed Work** section. Notice:
   - The prominent accessibility warning: *"Make sure the Google Drive document is accessible to the admin before submitting (e.g. Anyone with the link can view/comment)."*
   - The input field for the Google Drive / Document link.
5. Paste a sample document link (e.g. `https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing`).
6. Click **Submit for Review**.
7. **Expected Result**:
   - Status badge transitions to `Under Review`.
   - The submission section switches to a **locked read-only view** with an **Open Document** button.
   - An event `SUBMISSION_CREATED` is written to `activity_logs`.

---

## 3. Worker Submissions Log (`/user/submissions`)

1. In the Worker sidebar, click **My Submissions** (`/user/submissions`).
2. **Expected Result**:
   - The newly submitted task appears with status badge `Under Review`.
   - Clickable `View Doc` link and `View Task` button are available.

---

## 4. Admin Review Queue (`/admin/submissions`)

1. In your Admin browser window, visit the **Admin Dashboard** (`/admin/dashboard`).
   - Notice the **Submissions to Review** card shows `1 document awaiting review`.
2. Click **Submissions to Review** or click **Review Submissions** in the sidebar (`/admin/submissions`).
3. Under the **Pending Review** filter tab, observe the submission row:
   - Worker: `Jane Worker (@janeworker)`
   - Task: `Transcribe Handwritten Records Batch #101`
   - Submitted Date & Time
   - Status: `Under Review`
4. Click **Review**.
5. The **Review Worker Submission Modal** opens:
   - Displays worker details, timestamp, and task instructions.
   - Click **Open Document in New Tab** to verify that the Google Drive document link opens.

---

## 5. Admin Decision: FAIL with Written Reason & Resubmission

1. Inside the Review Modal, click **Mark as Failed**.
2. The failure form appears:
   - Enter a **Failure Reason / Correction Instructions**:
     ```
     Page 1 has several spelling errors in customer names. Rows 14 to 18 were skipped. Please correct these items and resubmit.
     ```
   - Ensure the checkbox **"Allow worker to fix and resubmit this task"** is checked.
3. Click **Confirm Mark as Failed**.
4. **Expected Result**:
   - The submission and task status update to `FAILED`.
   - An event `TASK_FAILED` is logged to `activity_logs` with the reason and resubmission status.

---

## 6. Worker Sees Failure Reason & Resubmits Work

1. Switch back to the Worker window and refresh `/user/tasks/[id]`.
2. **Expected Result**:
   - Status badge shows `Failed`.
   - A prominent feedback box displays:
     > **Admin Feedback / Failure Reason:**
     > Page 1 has several spelling errors in customer names. Rows 14 to 18 were skipped. Please correct these items and resubmit.
   - Below the feedback box, the **Resubmit Corrected Work** form is available.
3. Enter the updated Google Drive URL (or keep the existing URL) and click **Submit Corrected Work**.
4. **Expected Result**:
   - The task and submission status transition back to `Under Review`.
   - The submission form locks into the read-only review state again.

---

## 7. Admin Decision: PASS the Resubmission

1. Switch back to the Admin window and open `/admin/submissions`.
2. Open the pending review modal for the resubmitted task.
3. Click **Pass Submission**.
4. **Expected Result**:
   - The task and submission status update to `PASSED`.
   - An event `TASK_PASSED` is recorded in `activity_logs`.

---

## 8. Worker Sees Passed Status

1. Switch back to the Worker window and refresh `/user/tasks/[id]`.
2. **Expected Result**:
   - Status badge is green: `Passed`.
   - The celebration card displays: *"Task Completed & Passed! Reviewed and approved on [Date] by [Admin Name]"*.
   - A button to view the passed document is preserved.
3. Visit the **Worker Dashboard** (`/user/dashboard`):
   - The `Passed` stat card now shows `1`.
   - The `Pending`, `In Progress`, `Submitted`, and `Failed` counts accurately reflect the user's workload.

---

## 9. Admin Dashboard Verification

1. In the Admin window, visit `/admin/dashboard`.
2. Verify all numbers:
   - **Active Tasks**: Shows current open workload.
   - **Submissions to Review**: Shows `0` (all completed).
   - **Recent System Activity**: Lists `TASK_PASSED`, `SUBMISSION_CREATED`, `TASK_FAILED`, and `SUBMISSION_CREATED` in chronological order.

---

## Summary of Complete MVP Business Loop

You have verified the complete core workflow:
- [x] Admin creates task with source images
- [x] Worker opens task and reviews images
- [x] Worker starts work (`IN_PROGRESS`)
- [x] Worker submits Google Drive document link (`UNDER_REVIEW`)
- [x] Admin opens document and rejects with specific feedback (`FAILED`)
- [x] Worker reads failure reason and resubmits corrected link
- [x] Admin evaluates and passes the task (`PASSED`)
- [x] Both Admin and Worker dashboards reflect live counts in real-time
