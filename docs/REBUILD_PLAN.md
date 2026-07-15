# Rebuild Plan — HAULOPS

## Tujuan

Membangun ulang sistem HAULOPS dari awal berdasarkan dokumen-dokumen yang sudah tersedia: PRD, ERD, AGENT, IMPLEMENTATION_GUIDE, TASKS, dan visual spec.

Tujuan akhir adalah menghasilkan aplikasi web yang dapat dipakai untuk operasi hauling tambang dengan modul utama:

- login dan auth,
- shift management,
- rit operation,
- delay,
- maintenance,
- BBM,
- approval,
- dashboard,
- laporan,
- master data,
- dan settings.

---

## 1. Acuan Utama

Dokumen yang harus dijadikan sumber utama saat membangun ulang:

- [PRD.md](PRD.md)
- [ERD.md](ERD.md)
- [AGENT.md](AGENT.md)
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- [TASKS.md](TASKS.md)
- [TASK_TEMPLATE.md](TASK_TEMPLATE.md)
- [summary-operations-visual-spec.md](summary-operations-visual-spec.md)
- folder pages/ sebagai referensi UI prototype
    
---

## 2. Prinsip Rebuild

1. Bangun dari fondasi yang sederhana, aman, dan modular.
2. Jaga konsistensi dengan UI prototype yang sudah ada.
3. Jangan membuat fitur terlalu luas sebelum modul inti selesai.
4. Semua fitur harus mengikuti aturan bisnis di PRD dan relasi data di ERD.
5. Saat ada keputusan bisnis yang belum jelas, buat asumsi yang jelas lalu catat di dokumen.

---

## 3. Arsitektur Target

### Frontend

- React + TypeScript + Vite
- React Router
- TanStack Query
- Zustand
- Zod
- TailwindCSS

### Backend

- Express + TypeScript
- Prisma + PostgreSQL
- Zod
- JWT auth

### Repository

- monorepo dengan folder packages/web dan packages/server

---

## 4. Fase Pembangunan

### Fase 0 — Foundation

Tujuan:
- menyiapkan struktur proyek yang rapi dan siap dikembangkan,
- memastikan build berjalan stabil,
- menyiapkan dasar UI dan routing.

Deliverables:
- layout aplikasi utama,
- sidebar dan topbar,
- routing dasar,
- halaman login awal,
- komponen reusable dasar.

### Fase 1 — Auth dan Master Data

Tujuan:
- mengaktifkan akses pengguna dan struktur data utama.

Deliverables:
- login page,
- role-based access,
- master data awal: branch, unit, operator, material, pit, delay type,
- seed data minimal.

### Fase 2 — Core Operation Modules

Tujuan:
- menyelesaikan modul inti operasional.

Urutan prioritas:
1. shift
2. rit operation
3. delay
4. maintenance
5. BBM

Deliverables:
- CRUD dan workflow sederhana per modul,
- integrasi dengan data master,
- validasi rule bisnis dasar.

### Fase 3 — Approval dan Reporting

Tujuan:
- menambahkan kontrol review supervisor dan dashboard laporan.

Deliverables:
- approval workflow,
- dashboard KPI,
- laporan summary operations,
- export data.

### Fase 4 — Hardening

Tujuan:
- mematangkan kualitas aplikasi untuk dipakai nyata.

Deliverables:
- error handling,
- logging,
- audit trail,
- performance tuning,
- deployment setup.

---

## 5. Milestone Pertama yang Disarankan

Agar progres cepat dan masuk akal, milestone pertama sebaiknya mencakup:

- login page,
- layout aplikasi utama,
- halaman dashboard sederhana,
- modul shift dasar,
- endpoint API health check dan API shift awal,
- data master minimal.

Milestone ini cukup untuk menunjukkan sistem sudah “hidup” dan bisa terus dikembangkan.

---

## 6. Prioritas Pengerjaan per Modul

### A. Auth

- login,
- session state,
- role-based access.

### B. Master Data

- branch,
- unit,
- operator,
- material,
- pit,
- stockpile,
- delay type,
- status operation,
- budget target.

### C. Shift

- buka shift,
- tutup shift,
- assign unit,
- status pending approval.

### D. Rit Operation

- input rit,
- input tonase,
- status surat jalan,
- integrasi dengan shift.

### E. Delay

- input delay,
- grouping delay,
- hubungan dengan unit/shift.

### F. Maintenance

- input maintenance per shift dan unit,
- status breakdown/PM.

### G. BBM

- input konsumsi BBM,
- alokasi per unit.

### H. Approval

- approve/reject shift,
- edit request review,
- audit trail.

### I. Laporan

- dashboard KPI,
- summary operations,
- export Excel/CSV.

---

## 7. Panduan Implementasi untuk Agent Lain

Setiap agent yang ikut mengerjakan harus:

1. baca PRD, ERD, AGENT, dan TASKS terlebih dahulu,
2. pilih satu task kecil yang bisa selesai utuh,
3. gunakan TASK_TEMPLATE.md saat membuat task baru,
4. update TASKS.md setelah task selesai,
5. pastikan build tetap berhasil setelah perubahan.

---

## 8. Definition of Done

Sebuah task dianggap selesai jika:

- fitur bekerja sesuai tujuan,
- sesuai aturan bisnis di PRD,
- data model sesuai ERD,
- build berhasil,
- dan status task tercatat dengan jelas.

---

## 9. Rekomendasi Langkah Selanjutnya

Langkah berikut yang paling baik adalah:

1. bangun layout aplikasi utama,
2. implementasi login page,
3. implementasi halaman dashboard awal,
4. implementasi modul shift dasar,
5. lalu lanjut ke rit operation.

Dengan urutan ini, sistem akan terlihat hidup lebih cepat dan memudahkan evaluasi progres.

---

## 10. Status Saat Ini

Kemajuan utama saat ini:

- Backend API sudah berjalan di `scaf/packages/server` dengan Express + TypeScript.
- Autentikasi dan otorisasi sudah aktif: login, token bearer, logout, role-based guard.
- Modul backend inti sudah tersedia:
  - `master` (data branch, unit, operator, material, dll.)
  - `shift` (buka/tutup shift, approve/reject)
  - `rits` (list, detail, create, update, import, edit request)
  - `approvals` (approve/reject edit request, bulk approval/reject)
  - `delay` (input, update, ringkasan)
  - `maintenance` (input, update, issue/ready)
  - `BBM` (input dan laporan konsumsi)
  - `laporan` (daily, delay summary, BBM, maintenance, bulanan)
  - `dashboard` (KPI, chart, fleet status, alerts, recent rit)
  - `actual-operation` (status harian unit, update status, CSV export)
- Endpoint export sekarang mengembalikan CSV langsung untuk actual operation dan laporan.
- Test suite backend berjalan hijau: `npm test` mencatat `31 passed`.
- Frontend saat ini masih pada level prototype halaman `scaf/pages/`, belum terintegrasi penuh dengan API.

Area berikut masih bisa dilanjutkan:

- integrasi frontend React/Vite dengan API backend,
- implementasi UI utama, routing, dan kontrol akses di frontend,
- penyempurnaan edge case dan validasi pada bisnis flow,
- deployment pipeline dan database permanen (Prisma/PostgreSQL) untuk fase hardening.

---

## 11. Manual Testing Lokal

Langkah untuk menguji sistem secara manual di lingkungan lokal:

1. Jalankan backend:
   - Buka terminal di `scaf/packages/server`
   - Jalankan `npm install` jika belum, lalu `npm run dev`
   - Pastikan backend tersedia di `http://localhost:4001`
2. Jalankan frontend:
   - Buka terminal di `scaf/packages/web`
   - Jalankan `npm install` jika belum, lalu `npm run dev`
   - Buka browser ke `http://localhost:5173`
3. Verifikasi API health:
   - Akses `http://localhost:4001/api/health`
   - Harus mengembalikan JSON `{ ok: true, message: 'HAULOPS API is running' }`
4. Gunakan akun backend untuk menguji autentikasi:
   - Login lewat endpoint `/api/v1/auth/login` dengan `username: admin` dan `password: password`
   - Pastikan token diterima dan bisa dipakai untuk panggil `/api/v1/auth/me`
5. Uji alur utama:
   - Ambil data master: `/api/v1/master/branches`, `/api/v1/master/units`, `/api/v1/master/operators`
   - Buat shift: POST `/api/v1/shifts`
   - Tutup shift: POST `/api/v1/shifts/:id/close`
   - Input rit: POST `/api/v1/rits`
   - Buat permintaan edit rit: POST `/api/v1/rits/:id/edit-request`
   - Approve/reject edit request: POST `/api/v1/approvals/edit-requests/:id/approve` atau `/reject`
6. Uji export:
   - Akses `/api/v1/actual-operation/export` untuk menerima CSV
   - Akses `/api/v1/laporan/export?bulan=2026-06` untuk menerima laporan CSV
7. Gunakan browser dan `curl` atau Postman untuk simulasi alur yang berbeda:
   - pastikan header `Authorization: Bearer <token>` dikirim untuk semua API `api/v1/*`
   - periksa respons `401` saat token tidak sah atau sudah logout
8. Catat hasil dan bug:
   - Simpan langkah yang diuji, hasilnya, dan error yang muncul
   - Gunakan catatan ini untuk memperbaiki bug dan melengkapi dokumentasi QA
