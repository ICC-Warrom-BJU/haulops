# AGENT.md

## Project Context

Project ini adalah HAULOPS v2.0, sistem monitoring operasional hauling tambang yang dirancang untuk mendigitalisasi kegiatan harian seperti shift, rit operasi, delay, BBM, maintenance, approval, dashboard, dan laporan.

Saat ini workspace masih berisi prototype frontend statis berbasis HTML, CSS, dan JavaScript. Tujuan jangka panjang adalah mengubah prototype ini menjadi aplikasi web yang lebih matang dengan arsitektur terpisah antara frontend dan backend.

## Target Arsitektur

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
- Authentication: JWT + role-based access control
- State management: TanStack Query untuk server state, Zustand untuk state lokal/global ringan
- Validation: Zod
- Deployment: Docker + Nginx + GitHub Actions + VPS/DigitalOcean

## Prioritas Implementasi

Implementasi harus dilakukan bertahap dan masuk akal untuk MVP.

1. Foundation
   - setup monorepo atau struktur proyek yang jelas
   - auth/login dan role user
   - master data dasar
   - layout umum aplikasi (sidebar, topbar, header, filter, table, modal)

2. Core Operations
   - shift management
   - rit operation
   - delay
   - maintenance
   - BBM

3. Control & Reporting
   - approval workflow
   - dashboard
   - laporan
   - settings

## Prinsip Kerja Utama

- Selalu ikuti logika bisnis yang ada di PRD dan ERD.
- Jaga konsistensi UI dengan prototype yang sudah ada di folder pages.
- Jangan mengimplementasikan fitur yang terlalu luas sebelum modul inti selesai.
- Fokus pada fitur yang dapat dipakai langsung oleh user operasi dan supervisor.
- Prioritaskan data yang benar, valid, dan traceable dibanding sekadar tampilan yang bagus.

## Panduan Pengembangan

### 1. Business Rules yang Harus Dipertahankan

- Shift hanya boleh dibuka jika branch, tanggal, dan konteks operasional valid.
- Unit dapat dipakai di shift, rit, delay, BBM, dan maintenance.
- Delay fleet-wide dapat berlaku untuk banyak unit sekaligus.
- Maintenance hanya boleh ada satu record per unit per shift.
- Approval shift harus dilakukan setelah shift ditutup.
- Setiap edit request wajib mencatat nilai lama, nilai baru, alasan, dan reviewer.
- Semua tindakan penting harus memiliki audit trail minimal berupa user, timestamp, dan perubahan.

### 2. UI/UX Alignment

- Semua halaman harus punya struktur yang konsisten: sidebar, topbar, page header, toolbar/filter, content area, table/card, dan modal.
- Tombol utama seperti Add, Edit, Generate, Export, Filter, Save, Approve, Reject, dan Close harus tersedia di halaman yang relevan.
- Gunakan pattern visual yang sudah ada di prototype: card, badge status, filter panel, dan modal konfirmasi.
- Semua form penting harus punya validasi yang jelas dan pesan error yang mudah dipahami.

### 3. Backend Guidance

- Gunakan Prisma untuk model data dan migrasi.
- Validasi request dengan Zod.
- Pisahkan concern: routes, controllers, services, schemas, dan utils.
- Hindari logika bisnis yang tercampur langsung di controller.
- Semua operasi sensitif harus memeriksa role dan hak akses.

### 4. Frontend Guidance

- Buat halaman per modul, bukan satu file monolitik besar.
- Gunakan komponen reusable untuk tabel, modal, badge, filter, form, dan loading state.
- Gunakan TanStack Query untuk data yang diambil dari backend.
- Jangan simpan data penting hanya di local state tanpa mekanisme sinkronisasi.
- Pastikan data yang tampil di dashboard dan laporan selalu berasal dari backend yang valid.

## Struktur Folder yang Disarankan

Saat proyek dikembangkan secara penuh, gunakan struktur modular seperti:

- packages/web/src/pages
- packages/web/src/components
- packages/web/src/hooks
- packages/web/src/services
- packages/web/src/store
- packages/server/src/modules
- packages/server/prisma

## Kualitas yang Diharapkan

- Kode jelas, modular, dan mudah dikembangkan.
- Fitur utama bisa dipakai tanpa kebutuhan manual yang rumit.
- Perubahan pada satu modul tidak merusak modul lain.
- Workflow approval dan audit trail jelas dan aman.
- Dokumentasi PRD dan ERD tetap menjadi sumber utama saat implementasi.

## Ketika Mengubah Fitur

Jika ada perubahan signifikan terhadap fitur, aturan bisnis, atau UX, perbarui:

- PRD
- ERD
- dokumentasi implementasi terkait

## Catatan Khusus untuk Agent

Agent yang mengerjakan proyek ini harus:

- mempertahankan alur bisnis yang relevan dengan operasi tambang,
- tidak mengabaikan kebutuhan supervisor dan approval,
- menjaga konsistensi antara UI prototype dan implementasi nyata,
- dan membangun secara bertahap agar hasilnya realistic dan dapat dipakai.
