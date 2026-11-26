# PTP-KPU-Presensi Full-Stack Upgrade Specification

**Date:** 2026-11-27  
**Organization:** Komisi Pemilihan Umum (KPU) Provinsi Sulawesi Utara  
**Scope:** Full-Stack Upgrade (Security, Backend/Firestore, Business Logic, Next.js Admin Portal UI, Flutter Employee Mobile App UI)

## Approved Decisions
1. **Approach:** Full-Stack Upgrade — fix all P0/P1 security, sync, and business logic defects and elevate both Web Admin and Mobile UI to a unified institutional Operate design system.
2. **Account Provisioning:** Admin-only provisioning via Cloud Functions (`createManagedUser`, `updateManagedUser`, `setUserActive`, `completeInitialPasswordChange`). Remove open self-signup and remove plaintext `password`/`pin` storage from Firestore.
3. **Mobile App Scope:** Employee-only Flutter app (matching `README.md`). Remove embedded admin views, introduce a 4-tab bottom navigation shell (Presensi, Riwayat, Izin & Cuti, Profil), real selfie capture, live WITA clock, and direct sync with shared Firestore collections.

## Unified Firestore Schema
- `users/{uid}` (Admin SDK writes only): `uid`, `nip`, `name`, `role` (`kepala_bagian | kepala_sub_bagian | staff`), `positionLabel`, `departmentId`, `subdepartmentId` (slug or `null`), `isAdmin`, `active`, `mustChangePassword`, `hasPin`, `sessionVersion`, `createdAt`, `updatedAt`. No plaintext `password` or `pin`.
- `userSecrets/{uid}` (Admin SDK only, client denied): `pinHash`, `pinSalt`, `failedPinAttempts`, `pinLockedUntil`, `updatedAt`.
- `presensi/{docId}` (`${uid}_${YYYY-MM-DD}`): `uid`, `nip`, `nama`, `unit`, `departmentId`, `subdepartmentId`, `mode` (`WFO | WFH`), `dateKey`, `masukAt` (Timestamp), `masukIso` (`+08:00`), `keluarAt` (Timestamp|null), `keluarIso` (`+08:00`|null), `lateMinutes`, `earlyLeaveMinutes`, `workedMinutes`, `status`, `latitude`, `longitude`, `distanceMeters`, `accuracyMeters`, `checkInSelfieUrl`, `checkOutSelfieUrl`, `authMethod`, `updatedAt`.
- `requests/{docId}`: `uid`, `nip`, `name`, `unit`, `type`, `startDate`, `endDate`, `daysCount`, `reason`, `attachmentUrl`, `status` (`Menunggu | Disetujui | Ditolak`), `reviewNote`, `reviewedBy`, `reviewedAt`, `createdAt`.
- `settings/general`: `latitude`, `longitude`, `radius`, `wfhSchedule` (`Record<subdeptSlug, DayName[]>`), `workHours` (`startHour`, `startMinute`, `endHourMonThu`, `endMinuteMonThu`, `endHourFri`, `endMinuteFri`, `toleranceMinutes`), `holidays` (`Array<{ date: string; name: string }>`), `updatedAt`, `updatedBy`.

## Design System ("Civic Precision — KPU Sulawesi Utara")
- **Mode:** Operate (high-clarity institutional task software).
- **Palette:**
  - Canvas `#F6F7F9`, Surface `#FFFFFF`, Border `#E2E8F0`
  - Structural Chrome: Deep KPU Navy `#07142F` (hover `#10244D`)
  - Primary Brand Action: KPU Red `#D52832` (hover `#B91C1C`) — primary CTA and active brand mark only
  - Semantic: Emerald (`#047857` / `#ECFDF5`) = On-time / Approved / Verified; Amber (`#B45309` / `#FFFBEB`) = Late / Pending / Warning; Crimson (`#BE123C` / `#FFF1F2`) = Rejected / Absent / Missed Check-Out / Error; Cobalt (`#1D4ED8` / `#EFF6FF`) = WFH / Info; Navy (`#07142F` / `#F1F5F9`) = WFO.
- **Typography:** `Plus Jakarta Sans` UI + `JetBrains Mono` (`tabular-nums`) for NIP, WITA timestamps, coordinates, and Rupiah.
- **Accessibility & Craft:** WCAG AA ≥4.5:1 contrast, no eyebrow kickers above headings, single-layer borders (no ghost cards), `role="dialog"` + `Esc` close, keyboard focus rings, skeleton loaders, `SafeArea` + scrollable dialogs on mobile.
