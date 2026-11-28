# PTP-KPU-Presensi — Audit Findings, Fixes & Upgrade Report

**Date:** 2026-11-27  
**Organization:** Komisi Pemilihan Umum (KPU) Provinsi Sulawesi Utara  
**Scope:** Full-Stack Security, Backend (`firestore.rules` & Cloud Functions), Business Logic, Next.js Admin Portal (`admin-dashboard/`), and Flutter Employee Mobile App (`flutter_application_1/`)  
**Related Spec:** [2026-11-27-kpu-presensi-upgrade-design.md](./superpowers/specs/2026-11-27-kpu-presensi-upgrade-design.md)

---

## 1. What Was Found (Initial Audit)

The codebase had **two conflicting architectures stitched together**:
1. An earlier server-authoritative architecture (Cloud Functions with `nip_<18-digit>` UIDs, `sessionVersion` claims, `mustChangePassword` onboarding lock, and no plaintext credentials).
2. A later direct-Firestore web/mobile integration (`users`, `presensi`, `requests`, `settings/general`, open client self-signup, and plaintext `password`/`pin` storage).

That architectural seam caused critical **P0 security vulnerabilities**, **broken cross-app synchronization**, **inaccurate WITA/Tukin calculations**, **broken/outdated tests**, and **inconsistent UI/UX** across the web admin portal and mobile app.

---

## 2. Problems Identified & How They Were Fixed

### A. Security, Firestore Rules & Cloud Functions

| # | Problem Found | How It Was Fixed | Files Affected |
| :--- | :--- | :--- | :--- |
| 1 | **Open Admin Self-Signup & Plaintext Credentials:** Client code exposed `signUpAdmin`, allowing unauthenticated users to create admin accounts and writing plaintext `password` and `pin` fields into Firestore `users/{uid}`. | Removed open self-signup across both web and mobile apps. Provisioning and lifecycle management now run strictly via Admin-only Cloud Functions (`createManagedUser`, `updateManagedUser`, `setUserActive`, `resetUserPassword`, `completeInitialPasswordChange`), stripping plaintext `password`/`pin` fields. | `flutter_application_1/functions/src/user_service.js`, `flutter_application_1/functions/src/index.js`, `admin-dashboard/src/lib/auth.tsx`, `admin-dashboard/src/components/AdminLoginPage.tsx` |
| 2 | **Client-Trusted Attendance & Weak PIN Handling:** Mobile check-ins relied on device local clocks (vulnerable to clock tampering) and client-side plaintext PIN checks with no brute-force lockout. | Implemented server-authoritative `recordAttendance` and `setAttendancePin`/`verifyAttendancePin` Cloud Functions enforcing server WITA time, weekend/holiday blocking, WFH schedule check, Haversine geofencing, fake-GPS rejection, and `scrypt`-hashed salted PINs stored in client-inaccessible `userSecrets/{uid}` with 5-attempt / 15-minute lockout. | `flutter_application_1/functions/src/attendance_service.js`, `flutter_application_1/functions/src/pin_service.js`, `flutter_application_1/lib/features/attendance/data/presensi_sync_service.dart` |
| 3 | **Permissive Firestore Rules & Unsynced Copies:** Client writes to `users` and `presensi` were insufficiently locked down, and `requests.attachmentUrl` lacked URL scheme validation (allowing stored-XSS `javascript:` URIs). | Hardened `firestore.rules` and synced it byte-for-byte to `flutter_application_1/firestore.rules`: client writes to `users`, `userSecrets`, and `presensi` are blocked; `requests` enforces schema bounds + `^https?://.+` on `attachmentUrl`; `settings/general` restricts writes to verified admins. | `firestore.rules`, `flutter_application_1/firestore.rules` |
| 4 | **Legacy Subdepartment WFH Mismatch:** Flutter normalized legacy human-readable `subdepartmentId` labels (e.g., `"Keuangan"` → `"keuangan"`), while the server checked exact slugs only—causing WFO rejections on valid WFH days for legacy profiles. | Added `resolveSubdepartmentSlug()` in Cloud Functions and wired it into `isWfhAllowed()` to match Flutter's slug normalization 1:1. | `flutter_application_1/functions/src/organization.js`, `flutter_application_1/functions/src/attendance_service.js`, `flutter_application_1/functions/test/services.test.mjs` |

---

### B. Business Logic & Cross-App Synchronization

| # | Problem Found | How It Was Fixed | Files Affected |
| :--- | :--- | :--- | :--- |
| 1 | **Inaccurate WITA Timezone & Tukin Calculations:** Browser local timezones skewed daily rollups; national holidays and multi-day approved leaves were not accurately excluded from Alpha penalties; TL/PSW deduction tiers did not follow official regulations. | Built a unified WITA (`UTC+8`) and Tukin calculation engine implementing **Perpres 126/2017**, **Perpres 11/2016**, **Perpres 21/2023**, and **Juknis Tukin Setjen KPU** (TL1–TL4 / PSW1–PSW4 tiers, 1.5% missed check-out penalty, 3% Alpha penalty per elapsed non-holiday workday without attendance or approved leave, and ≤60 min replacement-hour tolerance). | `admin-dashboard/src/lib/attendance-policy.ts`, `admin-dashboard/src/lib/__tests__/attendance-policy.test.ts` |
| 2 | **Broken Cross-App Sync & Silent Save Failures:** Web Admin and Flutter wrote to mismatched schemas, and UI forms displayed "Saved" even when Firestore calls failed. | Aligned both apps onto normalized Firestore collections (`users`, `presensi`, `requests`, `settings/general`) with real-time `onSnapshot` subscriptions and explicit `ActionResult` error propagation. | `admin-dashboard/src/lib/store.tsx`, `flutter_application_1/lib/core/firebase/employee_workspace_repository.dart`, `flutter_application_1/lib/core/data/app_store.dart` |

---

### C. Next.js Admin Portal (`admin-dashboard/`)

| # | Problem Found | How It Was Fixed | Files Affected |
| :--- | :--- | :--- | :--- |
| 1 | **Inconsistent UI Tokens, Inverted Status Semantics & Accessibility Gaps:** Status colors varied or inverted across pages, modals lacked keyboard `Esc` dismissal / ARIA `role="dialog"`, and leave attachment links rendered raw unvalidated URLs. | Redesigned all 6 pages and shared shell components using the **Civic Precision** Operate design system (`#07142F` Deep KPU Navy, `#D52832` KPU Red, semantic Emerald/Amber/Crimson/Cobalt pills, `tabular-nums`, slide-over attendance proof drawer, CSV exports, accessible modals, and `/^https?:\/\//i` link guard). | `admin-dashboard/src/app/page.tsx`, `rekap/page.tsx`, `pegawai/page.tsx`, `izin/page.tsx`, `tukin/page.tsx`, `pengaturan/page.tsx`, `admin-dashboard/src/components/*` |
| 2 | **Dev Webpack `eval` Chunk Syntax Error & Missing `.env.local`:** Running `next dev` triggered `SyntaxError: Invalid or unexpected token` in `@firebase/auth` client chunk hydration, and `.env.local` was missing. | Created gitignored `admin-dashboard/.env.local` using the project's public web Firebase config (`ptp-kpu-presensi`), verified TypeScript (`tsc --noEmit`), and ran a clean production build (`next build` + `next start`). | `admin-dashboard/.env.local`, `admin-dashboard/tsconfig.json` |

---

### D. Flutter Employee Mobile App (`flutter_application_1/`)

| # | Problem Found | How It Was Fixed | Files Affected |
| :--- | :--- | :--- | :--- |
| 1 | **Embedded Admin Views, Static Clock & Incomplete Attendance Flow:** Mobile app duplicated admin screens, had no bottom navigation, showed a static clock, flashed "Presensi Masuk" on cold start, and lacked real selfie/biometric verification. | Removed all legacy embedded admin/signup views. Rebuilt into an employee-only 4-tab `NavigationBar` shell (**Presensi**, **Riwayat**, **Izin & Cuti**, **Profil**) with a live 1-second WITA clock, pre-check WFO geofence card, early-leave (PSW) confirmation guard, 3-step GPS → Front-Camera Selfie → Biometric/PIN verification dialog, Android `FlutterFragmentActivity` for `local_auth`, and redesigned auth/onboarding screens. | `flutter_application_1/lib/app/workspace.dart`, `employee_attendance_page.dart`, `attendance_flow_dialog.dart`, `employee_leave_tab.dart`, `employee_profile_tab.dart`, `login_panel.dart`, `change_password_panel.dart`, `create_pin_panel.dart`, `MainActivity.kt`, `AndroidManifest.xml`, `Info.plist` |
| 2 | **Synchronous `setState()` in `initState()` Crash:** When running offline or in widget tests (`!store.isRemote`), `_syncInitialState()` called `setState()` synchronously before any `await`, causing a Flutter build-phase exception. | Initialized `_initialLoading = store.isRemote && store.currentUser != null` and guarded `_syncInitialState()` to execute only when remote sync is required. | `flutter_application_1/lib/features/attendance/presentation/employee_attendance_page.dart` |
| 3 | **Stale Profile PIN State & Incomplete Weak-PIN Blocklist:** `ChangePinDialog` mutated `store.currentUser` without notifying listeners and omitted `012345`/`543210`. | Added `setCurrentUser()` on `AppStore` (calling `notifyListeners()`) and synced `_weakPins` across `ChangePinDialog`, `CreatePinPanel`, and `pin_service.js`. | `flutter_application_1/lib/core/data/app_store.dart`, `flutter_application_1/lib/features/attendance/presentation/widgets/change_pin_dialog.dart` |
| 4 | **Dialog Controller Timer Leak & Unvalidated Attachment URL:** `showLeaveRequestDialog` used a `Future.delayed(250ms)` disposal hack (causing widget-test pending-timer failures) and accepted non-HTTP(S) URLs. | Refactored into a stateful `_LeaveRequestDialog` widget with clean `State.dispose()` and `https?://` input validation. | `flutter_application_1/lib/features/leave/presentation/leave_request_dialog.dart` |
| 5 | **Broken Flutter Test Suite:** 4 of 5 test files still imported deleted admin/signup/tukin modules and asserted legacy UI labels. | Rewrote and updated the Flutter test suite to match the redesigned employee-only shell, WITA/WFH/ISHOMA policy, login panel, password/PIN onboarding, and `UserProfile` slug resolution. | `flutter_application_1/test/attendance_test.dart`, `login_panel_test.dart`, `user_onboarding_test.dart`, `widget_test.dart`, `remote_store_test.dart` |

---

## 3. Verification Results

| Check | Status | Details |
| :--- | :--- | :--- |
| **Cloud Functions Unit Tests** (`npm test`) | **Passed (4/4)** | User hierarchy validation, scrypt PIN hashing & 5-attempt lockout, WITA/geofence/WFH (including legacy slugs)/ISHOMA/holidays, `sessionVersion` enforcement. |
| **Admin Portal Policy Tests** (`attendance-policy.test.ts`) | **Passed (3/3)** | WITA parsing (UTC + naive), elapsed workdays excluding weekends/holidays, monthly Tukin Alpha/leave/replacement-hour calculation. |
| **TypeScript Typecheck** (`npx tsc --noEmit`) | **Passed (0 errors)** | Clean compilation across all Admin Portal source files. |
| **Next.js Production Build** (`npm run build`) | **Passed (9/9 routes)** | Static prerendering & optimization succeeded for `/`, `/izin`, `/pegawai`, `/pengaturan`, `/rekap`, `/tukin`, `/_not-found`. |
| **Live Browser Verification** (`http://localhost:3000`) | **Passed** | Zero console errors, zero failed network requests, logo & office backdrop images loaded, Firebase project `ptp-kpu-presensi` active. |
| **Cross-Stack Static Import & Sync Audit** | **Passed (0 errors)** | Checked 37 Dart files, 21 TS/TSX files, and 6 Cloud Functions JS/MJS files; verified root and `flutter_application_1/` `firestore.rules` are identical. |
| **Flutter Runtime Tests** (`flutter analyze` / `flutter test`) | **Pending Flutter SDK** | Flutter SDK is not installed on the current machine; test suite is updated and ready to execute once Flutter is available. |

---

## 4. Verification & Run Commands

```powershell
# Cloud Functions unit tests
cd flutter_application_1/functions
npm install && npm test

# Admin Portal tests, typecheck, build & start
cd ../../admin-dashboard
npm install
node --experimental-strip-types --test src/lib/__tests__/attendance-policy.test.ts
npx tsc --noEmit
npm run build && npm run start

# Flutter static analysis & test suite (requires Flutter SDK >= 3.38 / Dart >= 3.10)
cd ../flutter_application_1
flutter pub get && flutter analyze && flutter test
```
