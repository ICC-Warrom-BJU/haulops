# Implementation Guide for HAULOPS

## Tujuan Dokumen Ini

Dokumen ini adalah handoff guide untuk AI coding agent lain yang akan membantu membangun sistem HAULOPS. Tujuannya agar agent lain dapat memahami:

- status proyek saat ini,
- arsitektur yang sedang dipakai,
- prioritas implementasi,
- aturan kerja yang harus diikuti,
- dan apa yang sudah selesai versus yang belum.

---

## 1. Ringkasan Proyek

Project ini adalah sistem monitoring operasional hauling tambang dengan fokus pada:

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

Dokumen sumber utama yang harus dijadikan acuan:

- [PRD.md](PRD.md)
- [ERD.md](ERD.md)
- [AGENT.md](AGENT.md)

---

## 2. Status Proyek Saat Ini

### Sudah selesai

- review dokumen PRD dan ERD,
- pembuatan panduan agent,
- scaffold awal monorepo dengan:
  - frontend React + TypeScript + Vite,
  - backend Express + TypeScript,
  - struktur workspace awal,
- endpoint health check backend sederhana,
- build berhasil dijalankan.

### Sedang dipersiapkan

- layout aplikasi utama,
- routing halaman,
- login/auth flow,
- modul shift dan ritase awal,
- komponen UI reusable.

---

## 3. Arsitektur yang Disarankan

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS (akan ditambahkan saat fase UI matang)

### Backend

- Express
- TypeScript
- Prisma
- PostgreSQL

### Data & State

- Prisma untuk ORM dan migrasi,
- Zod untuk validasi,
- TanStack Query untuk server state,
- Zustand untuk state global ringan.

---

## 4. Aturan Kerja untuk Agent Lain

### Sebelum mengerjakan fitur

1. Baca dokumen berikut terlebih dahulu:
   - PRD
   - ERD
   - AGENT
   - IMPLEMENTATION_GUIDE ini
2. Pahami batasan MVP yang sedang difokuskan.
3. Pilih satu task kecil yang bisa diselesaikan secara utuh.
4. Jangan menambahkan fitur besar sebelum modul inti selesai.

### Saat mengubah kode

- jangan mengubah aturan bisnis tanpa memperbarui PRD atau ERD,
- jangan membuat logika bisnis di frontend saja jika itu seharusnya di backend,
- gunakan struktur folder yang konsisten,
- pastikan perubahan bisa dibuild dan diuji.

### Saat selesai mengerjakan

- jalankan build atau test yang relevan,
- tuliskan status perubahan di TASKS.md,
- jelaskan apa yang sudah selesai dan apa yang belum,
- jika ada keputusan bisnis yang penting, tambahkan ke dokumen PRD/ERD.

---

## 5. Prioritas Implementasi Saat Ini

### Fase 0 — Foundation

- [x] setup monorepo awal
- [ ] layout aplikasi utama
- [ ] routing halaman
- [ ] login page dan auth state
- [ ] shared UI components

### Fase 1 — Core Operations

- [ ] modul shift
- [ ] modul rit operation
- [ ] modul delay
- [ ] modul maintenance
- [ ] modul BBM

### Fase 2 — Control & Reporting

- [ ] approval workflow
- [ ] dashboard
- [ ] laporan
- [ ] settings

---

## 6. Rekomendasi Urutan Pengerjaan

1. bangun layout aplikasi dan routing dasar,
2. implementasi login dan autentikasi sederhana,
3. implementasi modul shift,
4. implementasi rit operation,
5. implementasi delay dan maintenance,
6. lanjut ke approval dan laporan.

---

## 7. Panduan Penamaan dan Struktur

Gunakan struktur modular yang jelas:

- packages/web/src/pages
- packages/web/src/components
- packages/web/src/hooks
- packages/web/src/services
- packages/web/src/store
- packages/server/src/modules
- packages/server/prisma

Jangan membuat satu file besar yang mengandung banyak concern.

---

## 8. Definisi Selesai (Definition of Done)

Sebuah task dianggap selesai jika:

- fitur atau perbaikan sudah berjalan sesuai kebutuhan,
- tidak ada error build yang baru,
- perubahan sudah sesuai dengan PRD/ERD,
- status task dicatat dengan jelas,
- dan hasilnya bisa dipahami oleh agent lain saat handoff.

---

## 9. Catatan Penting

- prototype frontend lama di folder pages tetap menjadi referensi visual,
- sistem harus tetap konsisten dengan UX yang sudah ada,
- business rules harus dipertahankan dari PRD dan ERD,
- tidak perlu membuat fitur yang terlalu kompleks sebelum modul inti siap.
