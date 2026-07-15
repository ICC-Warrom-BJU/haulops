# Task Handoff Template

Gunakan template ini setiap kali membuat task baru untuk AI agent lain.

---

## 1. Task Title

Singkat dan jelas.

Contoh:
- Implement login page
- Build shift list screen
- Add approval workflow API

## 2. Objective

Jelaskan tujuan task ini secara singkat.

Contoh:
- Membuat halaman login awal yang sesuai dengan desain prototype.
- Menyediakan endpoint API untuk melihat daftar shift.

## 3. Scope

Jelaskan batas task ini.

### Include
- fitur atau bagian yang harus dibuat

### Exclude
- fitur yang tidak termasuk dalam task ini

## 4. Business Context

Jelaskan konteks bisnis yang relevan.

Contoh:
- Login harus bisa membedakan role admin, supervisor, dan operator.
- Shift hanya bisa dibuka untuk branch dan tanggal yang valid.

## 5. Acceptance Criteria

List kriteria yang harus dipenuhi agar task dianggap selesai.

Contoh:
- halaman bisa dibuka tanpa error,
- data tampil sesuai mockup,
- build berhasil,
- fitur sesuai PRD/ERD.

## 6. Files to Change

Daftarkan file yang kemungkinan akan diubah.

Contoh:
- packages/web/src/pages/LoginPage.tsx
- packages/web/src/components/AuthForm.tsx
- packages/server/src/modules/auth/*

## 7. Implementation Notes

Berikan petunjuk teknis atau batasan penting.

Contoh:
- gunakan React + TypeScript,
- gunakan endpoint mock dulu jika backend belum siap,
- jangan ubah PRD tanpa approval.

## 8. Validation Steps

Berikan langkah verifikasi.

Contoh:
1. jalankan npm install
2. jalankan npm run build
3. buka halaman login di browser
4. cek hasil UI dan console

## 9. Dependencies

Sebutkan apakah task ini bergantung pada task lain.

Contoh:
- membutuhkan auth layout dari task sebelumnya,
- membutuhkan schema shift dari backend team.

## 10. Notes / Risks

Tuliskan hal yang perlu diperhatikan.

Contoh:
- data saat ini masih mock,
- ada kemungkinan perubahan skema di PRD,
- UI harus tetap konsisten dengan prototype lama.
