# Task Tracker for HAULOPS

## Status Ringkas

- [x] Review dokumen PRD dan ERD
- [x] Buat panduan agent awal
- [x] Buat scaffold monorepo awal
- [x] Verifikasi build berhasil
- [x] Implementasi layout aplikasi utama
- [x] Implementasi routing halaman
- [x] Implementasi login/auth flow (backend + frontend tersambung ke API)
- [x] Implementasi modul shift (backend + UI dasar terintegrasi API)
- [x] Implementasi modul rit operation (backend + UI dasar terintegrasi API)
- [x] Implementasi modul delay (backend + UI penuh terintegrasi API)
- [x] Implementasi modul maintenance (backend + UI penuh; rule 1 record/unit/shift)
- [x] Implementasi modul BBM (backend + UI penuh terintegrasi API)
- [x] Implementasi approval workflow (backend + UI edit-request rit)
- [x] Implementasi dashboard dan laporan (backend + UI; dashboard pakai data KPI nyata, laporan penuh + export CSV)

Catatan: seluruh modul inti sudah tersedia di backend `scaf/packages/server`
(lihat `REBUILD_PLAN.md` §10). Fokus berjalan sekarang adalah integrasi penuh
frontend React (`scaf/packages/web`) dengan API backend.

## Prioritas 1: Foundation

- [x] Buat layout utama aplikasi dengan sidebar, topbar, dan konten
- [x] Buat routing untuk halaman utama dan modul utama
- [x] Hubungkan frontend ke endpoint backend health check
- [ ] Siapkan komponen reusable untuk tombol, card, modal, dan tabel

## Prioritas 2: Auth dan Data Dasar

- [x] Implementasi halaman login
- [x] Simulasi autentikasi sederhana atau mock auth
- [ ] Siapkan schema data awal untuk master data
- [ ] Siapkan endpoint dasar untuk shift dan unit

## Test Suite & Build (2026-07-03)

Test backend kini **hijau & reproducible**: `npm test` → 31 passed (10 file).
`npm run build` (server, `tsc`) juga **hijau**.

Setup DB test (satu kali, DB terpisah `haulops_test` agar data dev aman):
```
docker exec haulops-db psql -U haulops -d haulops -c "CREATE DATABASE haulops_test;"
TEST_DATABASE_URL=postgresql://haulops:haulops_dev@localhost:5433/haulops_test \
  DATABASE_URL=postgresql://haulops:haulops_dev@localhost:5433/haulops_test \
  npm run test:db:setup   # = prisma migrate deploy
npm test
```
- `vitest.config.ts`: arahkan `DATABASE_URL` ke `haulops_test` (override `TEST_DATABASE_URL`),
  `fileParallelism:false` (sekuensial, aman berbagi 1 DB), `globalSetup`.
- `src/test/global-setup.ts`: TRUNCATE semua tabel + seed fixtures deterministik
  (`kala`, `unit-001..003`, `op-001` (User), `mat-ob/ore`, `delay-rain`,
  `shift-20260607-pagi-kala`, `status-standby`, dll) tiap run → reproducible.
- 3 test yang ditulis untuk kontrak lama di-rewrite agar cocok dengan route sekarang:
  `master` rate (`rateRpPerTon`+`berlakuDari`), `master` budget (`bulan:'07'`,`tahun`,
  tanpa `branchId`), `actual-operation` update (`statusOpId`+`catatan`).
- Fix build (pra-ada, bukan dari #2): `tsconfig` meng-exclude file `.test.ts` & `src/test`;
  `@types/express` diselaraskan ke v4 (dari v5) → hilangkan error `req.params`;
  `role` di augmentasi `Request.user` jadi `string`; hapus `as const` pada baris CSV
  laporan & actual-operation.

## Modul Shift — Modal "Buka Shift Baru" (2026-07-04)

Audit `scaf/pages/shift.html` lalu diterapkan ke `ShiftPage` (`App.tsx`):
- Modal form: Branch (auto/disabled), Tanggal, Tipe Shift (jam mulai/selesai/tersedia
  otomatis), lalu tabel **Unit DT Aktif** dengan kolom lengkap sesuai referensi:
  checkbox, Unit, Tipe Unit, **Kapasitas**, **Operator** (dropdown), **Material**
  (dropdown), **Status Awal** (Ready/Standby/Breakdown).
- Tombol **⚡ Generate Semua Unit Aktif** → centang semua unit.
- Tombol **📋 Generate dari Tanggal Lain** → sub-modal pilih tanggal+tipe sumber,
  menyalin operator/material/status dari shift sumber (via `GET /shifts/:id/units`).
- Backend: `POST /shifts` diperluas menerima `assignments[]` (unitId, operatorId,
  material, statusAwal) per unit — menggantikan auto-assign; `unitIds` lama tetap
  didukung (back-compat, test tetap hijau).
- Verifikasi: create shift dgn assignments → `GET /:id/units` mengembalikan
  operator/material/status yang benar (DT-001=Andi/OB/ready, DT-002=Budi/ORE/standby);
  `npm test` 31 passed; web & server build hijau.

## Modul Shift — Penyelesaian penuh vs shift.html (2026-07-04)

Semua elemen prototipe `shift.html` kini ada di `ShiftPage`:
- **Modal Buka Shift**: field lengkap (branch auto, tanggal, tipe→jam otomatis) +
  tabel unit (checkbox, unit, tipe, kapasitas, operator, material, status awal) +
  tombol **⚡ Generate Semua Unit Aktif** & **📋 Generate dari Tanggal Lain** (sub-modal).
- **Modal Detail Shift**: grid KPI + tab **Unit & Operator / Rit / Delay / BBM /
  Maintenance** dengan data nyata per shift (fetch paralel saat dibuka).
- **Modal Tutup Shift**: ringkasan + konfirmasi → `POST /:id/close`.
- **Approval cepat**: tombol Approve pada shift `pending` → modal review (KPI) →
  `POST /:id/approve` atau `/reject`.
- **Filter daftar**: Dari/Sampai Tanggal + Tipe Shift (via query `GET /shifts`),
  plus tombol Reset Filter. Kolom Aksi: Detail / Tutup (open) / Approve (pending).
- Backend: `POST /shifts` menerima `assignments[]` per-unit (back-compat `unitIds`).
- Verifikasi: filter tipe/tanggal benar; lifecycle create→close(pending)→approve
  →`approved`; detail tab menampilkan rits/delays/bbm/maintenance nyata; assignment
  operator/material persist; `npm test` 31 passed; web & server build hijau.

## Modul Rit Operation — batch grid (2026-07-04)

Audit `scaf/pages/rit-operation.html` → tombol **"+ Tambah Rit"** kini membuka
**modal grid input batch** di `RitPage`:
- Grid multi-baris: Unit, Operator, Material, Jumlah, Gross(kg), Tare(kg),
  Netto/Rit (auto), Catatan + hapus baris.
- Toolbar grid: **⬇ Isi ke Bawah** (samakan unit/operator/material dari baris 1),
  **📋 Duplikat** (baris terakhir), **+ Baris Baru**.
- Ringkasan: Baris / Total Rit / Total Netto.
- Simpan → `POST /rits/import` (batch). Form input cepat 1-rit lama tetap ada.
- Verifikasi: import 2 baris → 2 rit dibuat, noRit auto, netto benar (30 & 35 t);
  web build hijau.

## Modul Rit Operation — Pit/Stockpile, Delete, Import (2026-07-04)

1. **Pit & Stockpile** (sesuai permintaan, dikerjakan pertama):
   - Backend `rits.routes.ts`: `createSchema` menerima `pitId`/`stockpileId`;
     dipakai di create & import; include `pit`/`stockpile` di semua response rit.
   - Frontend: grid input rit dapat kolom **Pit** & **Stockpile** (dropdown dari
     `/master/pits` & `/master/stockpiles`); tabel rit menampilkan Pit & Stockpile.
   - Bonus fix: bug **noRit collision** — penomoran diganti dari berbasis `count`
     (rawan gap saat import) ke berbasis **MAX urutan** (`nextRitNo`), collision-proof.
   - Verifikasi: import rit dengan pit+stockpile → persist (Pit Utama / Stockpile A),
     noRit sekuensial (006, 007).
2. **Hapus rit**:
   - Backend: `DELETE /api/v1/rits/:id` (role supervisor/admin-mining/general-admin).
   - Frontend: tombol **Hapus** per baris + modal konfirmasi (`apiDelete`).
   - Verifikasi: DELETE `200` → GET `404`.
3. **Import Timbangan (CSV)**:
   - Modal import: pilih file `.csv` atau paste; header `unit,material,jumlah,gross,tare,catatan`
     (unit = kode, gross/tare kg); preview baris valid; **Proses Import** → `POST /rits/import`.
   - Client-side parsing (tanpa dependensi/library Excel); dibuat pada shift terpilih.
   - (Excel `.xlsx` penuh tidak diimplementasi — perlu library; CSV menutup kebutuhan.)
- `npm test` 31 passed; web & server build hijau.
4. **Ton/Rit default (estimasi)**: bila Gross & Tare kosong, Ton/Rit default ke
   **kapasitas tipe unit** (sesuai `rit-operation.html`).
   - Backend: create & import mengisi `estimasiTon = tipe.kapasitasTon` saat tanpa
     timbangan (fetch unit `include tipe`); `nettoTon` untuk yang bertimbangan.
   - Frontend: kolom grid berganti "Netto/Rit" → **Ton/Rit** (nilai estimasi
     ber-italic + "(est)"); Total Netto ikut estimasi; tabel rit tampilkan
     `~X t` saat memakai estimasi.
   - Verifikasi: rit tanpa timbangan → `estimasiTon=30` (kapasitas DT30), status
     manual; dengan timbangan → `nettoTon=27`, estimasiTon null, status imported.

5. **Grid auto-fill dari assign unit shift**: saat buka "+ Tambah Rit", grid otomatis
   terisi satu baris per unit yang di-assign pada shift terpilih (hari & shift sama),
   membawa operator & material dari assignment (`GET /shifts/:id/units`). Bila belum
   ada unit ter-assign, mulai dengan 1 baris manual. Plus kolom **Tipe Unit** (read-only,
   ikut unit) & modal input diperbesar near-full-screen (`.modal-full`, 96vw×94vh).

## Modul Delay — audit delay.html (2026-07-04)

`DelayPage` diperbarui mengikuti `scaf/pages/delay.html`:
- Header: **🔴 Input Delay Fleet** & **🟡 Input Delay Per Unit** (dua modal).
- **Modal Fleet**: jenis delay (scope FLEET), **Jam Mulai/Selesai** (datetime-local) →
  **durasi otomatis** + vs budget, checkbox **Full Day** (ikut jam shift), checklist
  unit terdampak + Pilih/Batalkan Semua. Semua unit tercentang → 1 record FLEET;
  sebagian → per-unit.
- **Modal Per Unit**: unit + jenis delay (scope UNIT) + jam mulai/selesai → durasi +
  budget.
- **Kartu Realisasi vs Budget**: grid per jenis delay (bar real/budget, badge over,
  hitung "X jenis over budget").
- **Log Delay**: kolom Jenis, Kategori, Scope, Unit, Mulai, Selesai, Durasi, Budget,
  Status (Over/OK), Catatan.
- Backend delay tidak diubah (sudah mendukung jamMulai/jamSelesai + fleet/unit).
- Verifikasi: fleet(all)→FLEET, fleet(subset)→per-unit, per-unit→UNIT; jam mulai/selesai
  & durasi persist; web build hijau.
- Update lanjutan: kolom **Unit** pada Log Delay untuk scope FLEET menampilkan **jumlah
  unit** (mis. "3 unit"), bukan "Semua unit". Tiap baris punya aksi **Detail / Edit /
  Hapus**:
  - Backend: tambah `DELETE /api/v1/delays/:id` (role supervisor/admin). Edit pakai
    `PUT /:id` yang sudah ada.
  - Frontend: modal Detail (read-only), modal Edit (jenis/jam/catatan → durasi auto),
    modal konfirmasi Hapus (`apiDelete`).
  - Verifikasi: create→edit(durasi 40→55, catatan persist)→delete(200, hilang dari list);
    `npm test` 31 passed.

## Modul Maintenance — audit maintenance.html (2026-07-04)

`MaintenancePage` diperbarui mengikuti `scaf/pages/maintenance.html`:
- Header: **+ Input Downtime** (modal).
- **Modal Input/Edit Downtime**: Unit (+ budget breakdown/hari), Jenis
  (Breakdown/PM/Full Day/Standby), Status (Ongoing/Completed), **Jam Mulai/Selesai**
  (datetime) → **durasi actual otomatis** + vs budget, checkbox **Full Day** (auto jam
  shift), Keterangan, **Part yang Diganti** (PM).
- **KPI cards**: Breakdown / PM / Full Day / Total Downtime (+ over-budget).
- **Tabel Downtime**: Unit, Tipe, Jenis, Status, Mulai, Selesai, Actual(jam),
  Budget(jam), Part, Keterangan; aksi **Detail / Edit / ✓ Ready (toggle) / Hapus**
  (actual > budget disorot merah).
- Backend `maintenance.routes.ts` diperluas: terima `jamMulai/jamSelesai/partDiganti`
  + jenis `standby`; `durasiJam` dihitung dari jam (else durasiMenit); `budgetJam`
  dari `unit.budgetBreakdownJam`; include `unit.tipe`; tambah `DELETE /:id`
  (role supervisor/admin). Rule 1 record/unit/shift (409) tetap.
- Verifikasi: create (jam→durasi, budget dari unit), edit (recompute durasi 3j),
  delete `200`; `npm test` 31 passed; web & server build hijau.

## Modul BBM — audit bbm.html (2026-07-04)

`BbmPage` diperbarui mengikuti `scaf/pages/bbm.html` (pola sama seperti Rit/Delay):
- Header: **+ Input Pengisian BBM** (modal grid batch).
- **Grid input batch** (near-full-screen): baris otomatis dari unit ter-assign shift
  (hari & shift sama); kolom Unit, Tipe (auto), Liter, Odometer, HM, Lokasi,
  Keterangan; + Baris Baru, Isi Lokasi ke Bawah, hapus baris; Total Liter; Simpan
  Semua → `POST /bbm/import`. Petugas BBM = user login.
- **KPI cards**: Total Liter / Jumlah Pengisian / Unit Terisi / Rata per pengisian.
- **Log BBM**: Unit, Tipe, Petugas, Jam, Lokasi, Liter, Odometer, HM, Keterangan +
  aksi **Detail / Edit / Hapus**.
- Backend `bbm.routes.ts` diperluas: `createSchema` terima `lokasi/jamPengisian/keterangan`;
  helper `createBbmRecord`; tambah `POST /bbm/import`, `PUT /:id`, `DELETE /:id`
  (role supervisor/admin); include `unit.tipe`.
- Verifikasi: batch import 2 (lokasi/petugas/tipe benar), edit liter 88→95, delete
  `200` (hilang dari list); `npm test` 31 passed; web & server build hijau.

## Modul BBM — jam/tanggal per baris + Fuel Station master (2026-07-05)

Penyesuaian lanjutan BBM:
- **Jam & tanggal per baris**: grid input BBM dapat kolom **datetime-local per baris**
  (bisa dipilih/disesuaikan, tidak terikat shift; default = tanggal shift + jam mulai).
  Edit BBM juga bisa ubah tanggal & jam.
- **Lokasi = Fuel Station (master data baru)**:
  - Schema: model **`FuelStation`** (id/kode/nama/branchId/aktif) + FK `fuelStationId`
    di `BBMLog`. Migrasi `add_fuel_station` diterapkan ke DB dev & test.
  - Master routes: `GET/POST/PUT /api/v1/master/fuel-stations`; di-seed 3 stasiun.
  - BBM: input **Lokasi jadi dropdown** dari fuel station; `lokasi` string di-denormalisasi
    dari nama stasiun; response include `fuelStation`.
  - **Master Data**: tab baru **Fuel Station** (list + tambah), jadi bisa dikonfigurasi.
- Verifikasi: create fuel station via master `200`; BBM import dgn `fuelStationId`+`jamPengisian`
  → lokasi & relasi fuelStation terisi, jam custom tersimpan; `npm test` 31 passed;
  web & server build hijau.

## Modul Approval — audit approval.html (2026-07-05)

`ApprovalPage` dibangun ulang jadi **3 tab** sesuai `scaf/pages/approval.html`:
- **Approval Shift**: kartu shift pending (KPI Ritase/Tonase/PA/UA), Approve/Reject
  satuan (`POST /shifts/:id/approve|reject`) + checkbox **Pilih Semua** & bulk
  Approve/Reject (`POST /approvals/bulk-approve|reject-shifts`).
- **Edit Request**: kartu per request dengan diff **Nilai Lama (merah) vs Nilai Baru
  (hijau)** per field (parse `nilaiLama`/`nilaiBaru` JSON), alasan; Approve/Reject
  satuan + bulk (loop endpoint edit-request).
- **Riwayat**: tabel history dari `GET /approvals` (shift + edit-request, status, oleh).
- Badge header "N Menunggu Review" (shift pending + ER pending); refresh badge sidebar
  setelah aksi.
- Fix tipe `EditRequest` FE agar sesuai backend (`tipe/recordId/field/nilaiLama/
  nilaiBaru/alasan/...`). Tanpa perubahan backend (endpoint sudah ada).
- Verifikasi: pending shifts 3, buat+approve edit-request, approve shift→approved,
  history 8 item; `npm test` 31 passed; web build hijau.

## Master Data — tambah konfigurasi Tipe Shift, Material, Fuel Type (2026-07-06)

Menyiapkan master data untuk field dropdown yang belum bisa dikonfigurasi:
- **Schema**: model baru **`FuelType`** (jenis BBM) & **`ShiftType`** (tipe shift + jam).
  Migrasi `add_fueltype_shifttype` diterapkan ke DB dev & test.
- **Master routes**: `materials` (POST/PUT baru; GET sudah ada), `fuel-types`
  (GET/POST/PUT), `shift-types` (GET/POST/PUT) — role admin utk tulis.
- **Seed**: 4 fuel type (Biosolar/Pertamina Dex/Dexlite/Solar Industri), 2 shift type
  (Pagi 07–17, Malam 19–07).
- **UI Master Data**: 3 tab baru — **Tipe Shift, Material, Fuel Type** (pola tab underline
  + modal tambah yang sama dengan tab lain). Total tab master: Unit, Operator, Tipe Unit,
  Tipe Shift, Material, Fuel Type, Jenis Delay, Fuel Station.
- Verifikasi: GET fuel-types(4)/shift-types(2), POST material `200`; `npm test` 31 passed;
  web & server build hijau.
- Belum di-wire ke modul operasi (Shift tipe & BBM fuel-type dropdown dari master) —
  menyusul, sesuai permintaan (bahas parameter & logic budget dulu).

## Master Data — 6 penyempurnaan sebelum wiring ke operasi (2026-07-06)

Merapikan master data (belum di-wire ke operasi):
1. **Unit**: tambah field **Nomor Rangka, Nomor Mesin, Kapasitas, Tahun** + tombol aksi
   **Lihat / Edit / Hapus** per baris (DELETE `/master/units/:id`).
2. **Tipe Unit**: tombol aksi **Lihat / Edit / Hapus** per baris.
3. **Operator**: tambah **NID** (kolom terpisah dari NIK), **No. Telepon**, **Data SIM
   & Lisensi** (No. SIM, Jenis SIM, Masa Berlaku), **Kontak Darurat** (Nama, Hubungan,
   No. Telepon) + tombol aksi Lihat/Edit/Hapus. Migrasi `master_ops_fields`.
4. **Master baru "Pit & Stockpile"**: CRUD Pit + CRUD Stockpile + **matriks jarak
   Pit×Stockpile (km)** yang admin isi sekali (upsert per pasangan via
   `pit-stockpile-distances`). Model baru `PitStockpileDistance`.
5. **Master baru "Hauling Rate"**: rate Rp/ton per branch × tipe unit × material ×
   (pit/stockpile opsional) + masa berlaku. Routes `rates` (GET/POST/PUT/DELETE),
   `rateCreateSchema` ditambah `pitId`/`stockpileId`.
6. **Jenis Delay**: budget per **Bulan** (tabel terpisah `DelayBudget {delayTypeId,
   bulan, budgetMenit}`) — selektor bulan + input budget per jenis; tombol **Generate
   per Bulan (Copy)** menyalin seluruh budget bulan sumber → target (`delay-budgets/generate`).
   DelayType tetap kanonik (budget default). Model baru `DelayBudget`.

- **UI**: 2 tab master baru (**Pit & Stockpile**, **Hauling Rate**); helper reusable
  `RowActions`, `ConfirmDelete`, `ViewModal`; `MasterAddModal` dapat `saveLabel`.
  Total tab: Unit, Operator, Tipe Unit, Tipe Shift, Material, Pit & Stockpile,
  Hauling Rate, Fuel Type, Jenis Delay, Fuel Station.
- Verifikasi: GET rates/distances/delay-budgets `200`; E2E delay-budget upsert + generate
  (copy 77 mnt Jul→Agu) OK; `npm test` **31 passed**; web & server build hijau.

## Wiring master data → operasi: Jarak Rit & Fuel Type BBM (2026-07-06)

Dua wiring pertama master data ke modul operasi (dipilih user):
1. **Jarak Pit↔Stockpile → Rit** (tanpa migrasi; `Rit.jarakKm` sudah ada):
   - Backend `rits.routes.ts`: helper `resolveJarakKm(pit, stockpile, provided)` — pakai
     nilai eksplisit bila ada, selain itu ambil dari matriks master
     (`PitStockpileDistance`). Dipakai di create & import; `jarakKm` ditambah ke `createSchema`.
   - Frontend Rit: kolom **Jarak (km)** di grid input (read-only, auto dari matriks) &
     di tabel rit tersimpan.
   - Seed: 1 jarak contoh (Pit Utama → Stockpile A = 12.5 km).
2. **Fuel Type → BBM** (perlu migrasi `add_bbm_fueltype`):
   - Schema: `BBMLog.fuelTypeId` (opsional) + relasi ke `FuelType` (`bbmLogs` back-relation).
   - Backend `bbm.routes.ts`: `fuelTypeId` di create/update schema, `fuelType` di include.
   - Frontend BBM: dropdown **Jenis BBM** di grid input, modal edit, kolom tabel, & detail.
- Verifikasi E2E (dev): rit tanpa jarak eksplisit → `jarakKm` terisi 12.5 dari matriks;
  BBM dengan `fuelTypeId` → persist + `fuelType.nama` di response. Migrasi diterapkan ke
  DB dev & test. `npm test` **31 passed**; web & server build hijau.
- **Belum dikerjakan** (opsi wiring lain): Tipe Shift → modul Shift, Delay budget per bulan
  → Delay/Dashboard, Hauling Rate → Laporan/Dashboard.

## Wiring master data → operasi: Tipe Shift → modul Shift (2026-07-06)

Tipe shift kini digerakkan master `ShiftType` (bukan lagi hardcode `pagi`/`malam`).
Tanpa migrasi — `Shift.tipe` sudah `String` di DB.
- **Backend `shift.routes.ts`**: `tipe` di query & create schema `z.enum(['pagi','malam'])`
  → `z.string()`. Jam mulai/selesai di-derive dari master `ShiftType` (lookup `kode = tipe`),
  fallback ke pola lama pagi/malam bila tipe belum terdaftar (data lama / test seed).
- **Frontend Shift**: load `/master/shift-types?aktif=true`; dropdown **tipe shift** di form
  buka shift, generate, dan filter kini dari master (kode+nama+jam). Jam Mulai/Selesai/Tersedia
  auto dari master (`shiftTersedia()` hitung durasi lintas tengah malam). Default tipe ikut
  master bila `pagi` tak ada. Label tampilan pakai nama master (`stLabel`); helper global
  `formatShiftType` kini `string`-safe (pagi/malam baku, kustom → Title-case).
- Verifikasi E2E (dev): shift tipe `siang` (12:00–20:00 dari master) → jam persist sesuai
  master; tipe `malam` → fallback 19:00–07:00. `npm test` **31 passed**; web & server build hijau.
- **Belum dikerjakan**: Delay budget per bulan → Delay/Dashboard, Hauling Rate → Laporan/Dashboard.

## Master Data baru: "Budget & Target" (bulanan) (2026-07-06)

Tab master baru berisi 7 parameter budget/target, semua ber-dimensi **bulan (01-12) +
tahun** (budget bisa berubah tiap bulan sesuai kondisi operasional).
- **Schema** (migrasi `add_budget_target`, dev & test):
  - 🆕 `BudgetBreakdownUnit` (#1, unit×bln×thn: `budgetJamPerHari` — batas jam downtime/hari)
  - 🆕 `TargetProduksiBranch` (#2, branch×bln×thn: `targetTon`)
  - 🆕 `BudgetRatioBbm` (#3, tipeUnit×bln×thn: `ratioLPerKm`)
  - ✅ `TargetRevenue` (#4, branch×bln×thn: `targetRp`) — model lama dipakai
  - 🆕 `TargetRevenueTipeUnit` (#5, tipeUnit×bln×thn: `targetRp`)
  - ♻️ `TargetMaterialBulanan` (#6+#7, branch×material×bln×thn: `targetRitase?`,`targetTon?`)
    — hasil repurpose model lama `TargetProduksi`.
  - Keputusan diskusi: #1 = jam downtime maks/hari; #3 = liter/km; target material
    **per branch**; total vs rincian **independen** (tanpa validasi jumlah).
- **Backend**: faktori `registerMonthlyMaster()` men-generate 4 endpoint per parameter
  (GET filter bln/thn · POST upsert per key · DELETE · POST `/generate` copy antar bulan).
  6 parameter terdaftar. Semua verified `200` (upsert+include+generate).
- **Frontend**: tab **Budget & Target** — selektor Bulan+Tahun global, tombol **Generate
  dari Bulan Lain (Copy)** (menyalin ke-6 parameter sekaligus), + 6 kartu (`BudgetTargetCard`
  reusable). Tiap kartu: tabel data tersimpan (periode terpilih) + **+ Tambah / Edit / Hapus**
  (modal pilih dimensi + nilai, upsert; hapus via DELETE + konfirmasi). Dimensi yang sudah
  punya data disaring dari pilihan "Tambah".
- **Test**: `global-setup` TABLES diperbarui (rename + tabel baru). `npm test` **31 passed**;
  web & server build hijau. Model lama `BudgetMaterialTarget` & `NettoEstimasi` dibiarkan
  (di luar scope). Field statik lama (`Unit.budgetBreakdownJam`, `TipeUnit.budget*`,
  `Material.targetProduksiBulanan`) tetap ada — versi bulanan ini menggantikannya secara fungsional.

## Wiring lanjutan + Redesign UI + Dark Mode (2026-07-06)

- **Wiring Tipe Shift → modul Shift**: `Shift.tipe` bebas (bukan enum pagi/malam),
  jam mulai/selesai di-derive dari master `ShiftType` (fallback ke pola lama bila
  tipe belum terdaftar). Tanpa migrasi.
- **Redesign UI penuh** (lihat `docs/DESIGN.md`): sistem desain "Modern SaaS bersih"
  dgn identitas amber/brown dipertahankan — token warna, tipografi, komponen
  (tombol, tabel, badge, KPI tile, modal) dirapikan di seluruh app.
- **Dark mode** — token dark diaktifkan via `@media (prefers-color-scheme)` +
  toggle manual (`[data-theme]`, persist localStorage, no-flash di `index.html`).
- **Avatar Multiavatar** — SVG deterministik dari seed (Settings → Avatar, picker +
  custom text), avatarUrl di User dipakai sebagai seed (bukan URL gambar).

## Dashboard Monitoring Harian (2026-07-07)

Dashboard baru: PA%/UA%, breakdown, delay, produksi, revenue, rasio BBM — **harian
+ akumulasi bulan berjalan (MTD)**, semua dibandingkan ke target/budget. Plus mode
**"Semua Branch"** untuk perbandingan antar-branch.
- **Insight kunci**: `DelayType.kenaPA` memisahkan efek delay ke **PA** (dianggap
  tidak available) vs **UA** (available tapi tidak dimanfaatkan) — dikombinasikan
  dengan `Maintenance` + jam terjadwal (`ShiftUnit`+`Shift.jamMulai/jamSelesai`).
- **Revenue otomatis**: `resolveRate()` mencari `Rate` berlaku per rit
  (branch+tipeUnit+material+pit/stockpile+tanggal, spesifik→generik→terbaru),
  rit tanpa rate cocok masuk `unpricedRitCount` (bukan diam-diam dianggap 0).
- Endpoint baru: `GET /dashboard/daily`, `GET /dashboard/daily-compare`.
  Tanpa migrasi schema (semua model sudah ada).
- **Verifikasi**: 4 test baru, `npm test` 35 passed; build hijau.

## Modul "Status Operator" (validasi kesiapan harian) (2026-07-07)

Model baru `OperatorStatusType` (katalog: Ready/Sakit/Izin/Cuti/Alpha/Training/Off)
+ `OperatorDailyStatus` (operator×tanggal, unik). Role baru `koordinator-operator`.
- **Grid Bulanan**: 1 halaman, baris=operator, kolom=tanggal 1..akhir bulan, sel=
  kode 1-huruf berwarna (klik sel → modal set status). Endpoint `GET /monthly`
  (satu query untuk seluruh bulan, bukan 31 request terpisah).
- **Histori** per operator (rentang tanggal) + tombol **Generate** (salin status
  dari tanggal sumber ke target).
- **Integrasi Shift**: dropdown assignment operator diberi tanda `⚠` untuk yang
  non-Ready/belum divalidasi (soft-warning, tidak mem-block assign).
- Menu sidebar terpisah + tab Master Data "Status Operator" (kelola katalog).
- **Verifikasi**: 8 test, migrasi `add_operator_daily_status`.

## Manajemen User & Permission (referensi) (2026-07-07)

- **User CRUD** (`Master Data → User`): sebelumnya cuma bisa 1x lewat
  `/auth/register` (blocked setelah ada user pertama). Sekarang admin-mining/
  general-admin bisa tambah/edit/nonaktifkan (`aktif`, bukan delete keras) + reset
  password user lain. Password tidak pernah ke-expose di response.
- **Permission (referensi)** (`Master Data → Permission`): tabel `ModulePermission`
  mendokumentasikan role apa saja yang boleh akses tiap modul (hasil audit ~69 titik
  `requireRole` di 8 file route) — **bukan mesin enforcement**, ada disclaimer jelas
  di UI. Rencana enforcement sungguhan dicatat di `docs/PHASE2_PLAN.md`.
- **Verifikasi**: 12 test master.routes, migrasi `add_module_permission`.

## Target PA%/UA% + Sidebar UX (2026-07-07)

- **Target PA%/UA%** ditambahkan sbg parameter ke-8 di Budget & Target (per
  branch/bulan, model `TargetAvailabilityBranch`) — dibandingkan ke aktual di
  Dashboard Monitoring Harian (status good/warn/bad, bukan cuma hitung tanpa target).
- **Sidebar**: tombol Ganti Tema, status API, dan Keluar dipindah jadi ikon-only
  di bawah avatar sidebar (sebelumnya di topbar, teks penuh).

## Bug fix: tonase rit tidak ikut `jumlahRit` (2026-07-07)

Ditemukan saat membuat data dummy siklus penuh (branch "Project NPM", 5 unit,
4 operator, 2 shift, 11 record rit via API sungguhan — bukan seed langsung).
`nettoTon`/`estimasiTon` di `rits.routes.ts` tidak dikali `jumlahRit` (1 record
`jumlahRit=3` dihitung tonase seolah 1 trip), padahal preview frontend
(`gridTotalNetto`) sudah lama mengasumsikan perkalian ini — jadi ada
ketidaksesuaian nyata antara preview vs tersimpan. Fix: kalikan `jumlahRit` di
kedua jalur (`POST /rits` & `POST /rits/import`). 3 test baru mengunci perbaikan.

## Housekeeping: fix tonase Laporan + Branch CRUD (2026-07-07)

- **`laporan.routes.ts`**: 4 tempat masih `nettoTon ?? 0` tanpa fallback
  `estimasiTon` (gap yang sengaja ditunda saat membangun Dashboard Monitoring
  Harian) — sekarang disamakan (`nettoTon ?? estimasiTon ?? 0`), supaya modul
  Laporan tidak under-report tonase branch `WITHOUT_TIMBANGAN`.
- **Branch CRUD**: sebelumnya branch baru cuma bisa lewat SQL langsung (dialami
  saat membuat data dummy Project NPM). Tambah `POST/PUT /master/branches` +
  tab Master Data "Branch" (kode+nama+skema timbangan+aktif, tanpa delete keras).
- **Verifikasi**: 60 test passed (13 file), build web & server hijau.

## Prioritas 3: Core Modules

- [ ] Shift management
- [ ] Rit operation
- [ ] Delay
- [ ] Maintenance
- [ ] BBM

## Catatan untuk Agent Lain

Saat mengerjakan task, update checklist ini secara berkala dan tambahkan catatan jika ada keputusan penting atau blocker.

## Catatan Progress

- 2026-07-02: Fase foundation awal di `scaf/packages/web` selesai: mock login, app shell, sidebar/topbar, hash routing modul utama, dashboard awal, halaman shift dasar, placeholder modul lain, dan indikator `/api/health`.
- 2026-07-03: Integrasi frontend ⇆ backend diperbaiki di `scaf/packages/web/src/App.tsx`.
  Sebelumnya frontend tidak bisa build/berfungsi. Yang diperbaiki:
  - Login nyata ke `POST /api/v1/auth/login` (akun `admin/password`,
    `supervisor/password`), menggantikan mock `demoUsers` yang tidak terdefinisi.
  - Layer API diseragamkan: path relatif `/api/v1/...` lewat proxy Vite,
    Bearer token disisipkan otomatis, dan respons `401` memaksa logout.
  - Perbaikan tipe `SessionUser` (`nama`/`branchId`) dan bidang `Unit.tipe.nama`.
  - `branchId` tidak lagi di-hardcode `br-kal-a`; memakai branch milik user login,
    dan nama branch di-resolve dari `/api/v1/master/branches`.
  - Tambah `src/vite-env.d.ts` agar tipe `vite/client` (import CSS) dikenali.
  - Verifikasi: `npm run build` (web) hijau.
- 2026-07-03: Perbaikan bug crash backend (schema vs route tidak sinkron).
  Route ditulis untuk skema audit versi lama (kolom string `createdBy`/`closedBy`/
  `approvedBy`/`reviewedBy`), padahal `schema.prisma` final memakai relasi FK ke
  `User` (`closedById`/`approvedById`/`reviewedById`/`dibuatById`). Akibatnya
  setiap create shift / rit edit-request / approval melempar `PrismaClientValidationError`
  yang **tidak tertangani → proses server mati**. Yang diperbaiki:
  - `shift.routes.ts`: hapus tulis `createdBy`; close pakai `closedById=req.user.id`
    + `closedAt`; approve pakai `approvedById=req.user.id` + `approvedAt`.
  - `rits.routes.ts`: edit-request pakai `dibuatById=req.user.id`.
  - `approvals.routes.ts`: approve/reject edit-request pakai `reviewedById=req.user.id`;
    bulk-approve pakai `approvedById`; perbaiki bug urutan bulk approve/reject yang
    mengambil daftar id **setelah** update (selalu kosong) → sekarang diambil sebelum.
  - Verifikasi runtime (DB di `localhost:5433`, container `haulops-db`): alur penuh
    login → buka shift → input rit (noRit + netto terhitung) → edit-request →
    approve (rit ter-update) → reject → tutup shift → approve shift semuanya
    `2xx` dan server tidak crash.
  - Catatan jujur soal test suite: `vitest` (`31 test`) ditulis terhadap kontrak API
    LAMA dan belum direkonsiliasi — mis. test rate mengirim `{materialId, rateTon,
    active}` sedangkan route butuh `{branchId, tipeUnitId, materialId, rateRpPerTon,
    berlakuDari}`; test budget kirim `bulan:'2026-07'` sedangkan route butuh `^\d{2}$`;
    banyak test mengandalkan seed deterministik (`kala`, `unit-001`, `op-001`,
    `shift-20260607-pagi-kala`) yang TIDAK ada di `prisma/seed.ts`. Menyamakan test
    dan route perlu keputusan "kontrak mana yang kanonik" dan sebaiknya jadi task
    tersendiri. Suite belum hijau (bukan regresi dari perubahan ini).
- 2026-07-03: Hardening error-handling backend (Fase 4). Sebelumnya error tak
  tertangani di route async **mematikan seluruh proses server** (Express 4 tidak
  meneruskan Promise rejection ke error middleware secara otomatis). Ditambahkan:
  - `src/async-errors.ts`: menambal prototipe Router (di-import paling awal di
    `app.ts`) agar rejection tiap handler async diteruskan ke `next(err)`.
  - Error-handling middleware global (arity 4) di akhir `app.ts` → mengembalikan
    `500 { error: { code: 'INTERNAL_ERROR' } }` alih-alih crash.
  - Verifikasi: memicu unique-violation Prisma (buka ulang shift yang sudah ada)
    kini menghasilkan `HTTP 500` JSON, server tetap `health 200`, error tercatat
    di log; alur normal login→shift→rit→approval tetap `2xx` (tanpa regresi).
- 2026-07-03: Modul Delay (UI penuh) — `DelayPage` di `App.tsx`.
  - UI: filter branch/shift, form jenis delay + lingkup (Fleet-wide / Per unit
    dengan multi-select unit), durasi menit, catatan; tabel daftar delay; ringkasan
    durasi per jenis vs budget untuk shift terpilih.
  - Seed: tambah 4 `DelayType` deterministik (`delay-rain`, `delay-nodriver`,
    `delay-breakdown`, `delay-changeshift`) di `prisma/seed.ts` (sebelumnya kosong).
  - Fix bug backend `delay.routes.ts` (schema mismatch): `jamMulai` wajib → default
    `new Date()`; field `catatan` dipetakan ke kolom schema `keterangan` (create &
    update). Sebelumnya create delay selalu 500.
  - Verifikasi: buat delay fleet-wide (scope FLEET) & per-unit (scope UNIT) →
    `200`, list mengembalikan keduanya; web `npm run build` hijau.
- 2026-07-03: Modul Maintenance (UI penuh) — `MaintenancePage` di `App.tsx`.
  - UI: filter branch/shift, form unit + jenis (breakdown/pm/full-day) + status +
    durasi + catatan; tabel record; aksi toggle status open↔closed (Tandai Ready).
  - Fix backend `maintenance.routes.ts`: `jamMulai` wajib → default `new Date()`;
    map `catatan`→kolom `keterangan` (create & update); tambah guard 409 untuk
    business rule "satu record maintenance per unit per shift".
  - Verifikasi: create `200` (durasiJam terhitung), duplikat unit+shift `409
    MAINTENANCE_EXISTS`, toggle status→closed `200`, list `200`.
- 2026-07-03: Modul BBM (UI penuh) — `BbmPage` di `App.tsx`.
  - UI: filter branch/shift, form unit + liter + odometer + HM; tabel pengisian +
    total liter. `operatorBbmId` memakai id user login (kolom FK ke User).
  - Fix backend `bbm.routes.ts`: `jamPengisian` wajib → default `new Date()`.
  - Ditambah helper `apiPut` di frontend untuk endpoint update (dipakai maintenance).
  - Verifikasi: create bbm `200` (petugas terisi), list `200`, report per-unit `200`.
- 2026-07-03: Modul Laporan (UI penuh) — `ReportsPage` di `App.tsx` + Dashboard dirapikan.
  - `ReportsPage`: filter tanggal & bulan (default ke shift terbaru agar langsung
    berisi data), KPI harian (ritase/tonase/delay/BBM), rekap bulanan, ringkasan
    delay per jenis vs budget, maintenance per jenis, detail shift harian, konsumsi
    BBM per unit, dan **export CSV** (harian & bulanan) via unduhan blob ber-auth
    (helper `downloadCsv`, kirim Bearer + tangani 401).
  - Dashboard: KPI kini dari `/dashboard/kpi` (pending/approved/branch) + total
    ritase/tonase dari `/laporan/daily`; kartu delay pakai `/dashboard/delay-vs-budget`
    (data nyata), menggantikan angka statis.
  - Endpoint laporan/dashboard tidak diubah (sudah benar); tidak ada perubahan backend.
  - Verifikasi end-to-end (data hasil modul lain): daily `200` (rit 2, tonase 60,
    delay 135m, maintenance 1, BBM 150L), delay-summary/bbm/maintenance/bulanan `200`,
    export CSV `200` (Content-Type text/csv, header+baris benar); web build hijau.
- 2026-07-03: Modul Master Data (UI penuh) — `MasterDataPage` di `App.tsx`.
  - Tab: Unit, Operator, Tipe Unit, Jenis Delay — masing-masing list + form tambah.
  - Unit: tambah (kode/polisi/tipe/branch/status) + ubah status inline (PUT).
  - Operator & Tipe Unit & Jenis Delay: tambah + list.
  - Semua endpoint master sudah benar — TIDAK ada perubahan backend.
  - Verifikasi: create tipe-unit/unit/operator/delay-type `200`, update status unit
    `200`, list `200`; web build hijau. (Create butuh role admin-mining/general-admin;
    akun `admin` memenuhi.)
- 2026-07-03: Modul Settings (UI penuh) — `SettingsPage` di `App.tsx`.
  - Kartu Profil: nama, username, role, branch (di-resolve), login terakhir (dari
    `GET /api/v1/auth/me`).
  - Form Ubah Password → `PUT /api/v1/auth/password` (validasi min 6 + konfirmasi).
  - Tidak ada perubahan backend (endpoint sudah ada).
  - Verifikasi (pakai akun supervisor, lalu dikembalikan): `/me` `200`, ganti password
    `200`, login password lama `401`, login password baru `200`, revert `200`,
    login pulih `200`. Web build hijau.
  - Catatan ops: Docker Desktop sempat mati antar-sesi → container `haulops-db` (5433)
    di-start ulang (`docker start haulops-db`); data tetap ada (volume pgdata). Error
    middleware backend menahan agar server tidak crash saat DB sempat tak terjangkau.
- Status frontend: SELESAI — semua 10 route punya UI nyata terhubung API (dashboard,
  shift, rit, delay, maintenance, BBM, approval, laporan, master data, settings).
  `ModulePlaceholder` kini jadi fallback yang tak terpakai.

## Deployment: Railway + Render + Supabase (2026-07-14)

**Arsitektur:**
- 🚂 **Railway** → Frontend (React/Vite — disajikan via Nginx Docker)
- 🎨 **Render** → Backend (Express + Prisma — Docker multi-stage)
- 🟩 **Supabase** → Database PostgreSQL (Free Tier permanen)

**File konfigurasi yang sudah dibuat:**
- [x] `scaf/packages/server/Dockerfile.prod` — Dockerfile production backend (multi-stage)
- [x] `scaf/packages/web/Dockerfile.prod` — Dockerfile production frontend (Vite → Nginx)
- [x] `scaf/packages/web/nginx.conf` — Nginx config untuk SPA React Router
- [x] `render.yaml` — Render Blueprint (auto-detect di root repo)
- [x] `railway.json` — Railway config (Dockerfile builder)
- [x] `scaf/packages/server/.env.example` — panduan environment variables production
- [x] `scaf/packages/server/prisma/schema.prisma` — tambah `directUrl` untuk Supabase pooler
- [x] `.github/workflows/server-tests.yml` — CI/CD GitHub Actions (TypeCheck + Build)

**Langkah manual yang perlu dilakukan:**

### 1. Supabase (Database)
- [ ] Buat akun di https://supabase.com
- [ ] Buat project baru (region: Asia Southeast — Singapore)
- [ ] Catat: `DATABASE_URL` (Transaction Pooler, port 6543) dan `DIRECT_URL` (Session Pooler / Direct, port 5432)
- [ ] Tidak perlu buat tabel manual — Prisma migrate akan handle

### 2. Render (Backend)
- [ ] Buat akun di https://render.com
- [ ] New > Blueprint Instance > Hubungkan repo GitHub
- [ ] Render otomatis baca `render.yaml` di root repo
- [ ] Set environment variables di Render Dashboard:
  - `DATABASE_URL` → Transaction Pooler URL dari Supabase
  - `DIRECT_URL` → Direct/Session Pooler URL dari Supabase
  - `JWT_SECRET` → auto-generated oleh Render
  - `CORS_ORIGIN` → URL Railway frontend (setelah deploy frontend)
- [ ] Tunggu deploy selesai, catat URL backend (misal: `https://haulops-server.onrender.com`)

### 3. Railway (Frontend)
- [ ] Buat akun di https://railway.app
- [ ] New Project > Deploy from GitHub repo
- [ ] Railway otomatis baca `railway.json` di root repo
- [ ] Set environment variable:
  - `VITE_API_URL` → `https://haulops-server.onrender.com/api/v1`
- [ ] Setelah deploy, update `CORS_ORIGIN` di Render dengan URL Railway
- [ ] Verifikasi: akses frontend Railway → login → cek API terhubung

### 4. Verifikasi Akhir
- [ ] `GET /api/v1/health` dari URL Render mengembalikan 200
- [ ] Frontend Railway berhasil login dengan akun dari Supabase DB
- [ ] Prisma migration sudah berjalan (tabel terbuat di Supabase)

