# Entity Relationship Diagram (ERD)

## HAULOPS v2.0 — Sistem Monitoring Operasional Hauling Tambang

Dokumen ini menjelaskan struktur data utama, hubungan antar entitas, serta alur informasi yang dipakai oleh sistem HAULOPS.

---

## 1. Tujuan ERD
ERD ini digunakan untuk:
- memodelkan data master dan transaksi operasional,
- menjelaskan hubungan antar tabel,
- menjadi acuan implementasi database Prisma/PostgreSQL,
- memastikan konsistensi data antar modul Shift, Rit, Delay, Maintenance, BBM, Approval, dan Laporan.

---

## 2. Konsep Utama Sistem
Sistem ini mengelola data operasional hauling yang terdiri dari:
- data master: branch, unit, operator, pit, stockpile, material, rate, delay type, status operation, budget & target,
- data transaksi harian: shift, shift unit, rit, delay, maintenance, BBM,
- data kontrol: approval, edit request, audit trail,
- data laporan: hasil agregasi dari transaksi harian.

---

## 3. Daftar Entitas Utama

### 3.1 Master Data
- Branch
- TipeUnit
- Unit
- Operator
- Material
- LokasiPit
- LokasiStockpile
- Rate
- NettoEstimasi
- DelayType
- StatusOperation
- BudgetMaterialTarget
- TargetProduksi
- TargetRevenue

### 3.2 Transaksi Operasional
- Shift
- ShiftUnit
- Rit
- Delay
- Maintenance
- BBMLog
- ActualStatus

### 3.3 Approval & Audit
- Approval
- EditRequest

### 3.4 User & Auth
- User

---

## 4. Hubungan Entitas

### 4.1 Hubungan Master Data

#### Branch ↔ Unit
- Satu Branch memiliki banyak Unit.
- Satu Unit milik satu Branch.

#### Branch ↔ Operator
- Satu Branch memiliki banyak Operator.
- Satu Operator milik satu Branch.

#### Branch ↔ Shift
- Satu Branch memiliki banyak Shift.
- Satu Shift milik satu Branch.

#### TipeUnit ↔ Unit
- Satu TipeUnit memiliki banyak Unit.
- Satu Unit memiliki satu TipeUnit.

#### TipeUnit ↔ Rate
- Satu TipeUnit memiliki banyak Rate.
- Satu Rate milik satu TipeUnit.

#### TipeUnit ↔ NettoEstimasi
- Satu TipeUnit memiliki banyak NettoEstimasi.
- Satu NettoEstimasi milik satu TipeUnit.

#### TipeUnit ↔ BudgetMaterialTarget
- Satu TipeUnit memiliki banyak BudgetMaterialTarget.
- Satu BudgetMaterialTarget milik satu TipeUnit.

#### Material ↔ Rate
- Satu Material memiliki banyak Rate.
- Satu Rate milik satu Material.

#### Material ↔ NettoEstimasi
- Satu Material memiliki banyak NettoEstimasi.
- Satu NettoEstimasi milik satu Material.

#### Material ↔ BudgetMaterialTarget
- Satu Material memiliki banyak BudgetMaterialTarget.
- Satu BudgetMaterialTarget milik satu Material.

#### Material ↔ TargetProduksi
- Satu Material memiliki banyak TargetProduksi.
- Satu TargetProduksi milik satu Material.

#### LokasiPit ↔ Rit
- Satu LokasiPit dapat dipakai oleh banyak Rit.
- Satu Rit dapat memiliki satu LokasiPit.

#### LokasiStockpile ↔ Rit
- Satu LokasiStockpile dapat dipakai oleh banyak Rit.
- Satu Rit dapat memiliki satu LokasiStockpile.

---

## 5. Hubungan Transaksi Operasional

### 5.1 Shift ↔ ShiftUnit
- Satu Shift memiliki banyak ShiftUnit.
- Satu ShiftUnit milik satu Shift.

### 5.2 Shift ↔ Rit
- Satu Shift memiliki banyak Rit.
- Satu Rit milik satu Shift.

### 5.3 Shift ↔ Delay
- Satu Shift memiliki banyak Delay.
- Satu Delay milik satu Shift.

### 5.4 Shift ↔ Maintenance
- Satu Shift memiliki banyak Maintenance.
- Satu Maintenance milik satu Shift.

### 5.5 Shift ↔ BBMLog
- Satu Shift memiliki banyak BBMLog.
- Satu BBMLog milik satu Shift.

### 5.6 Unit ↔ ShiftUnit
- Satu Unit bisa dipakai di banyak ShiftUnit.
- Satu ShiftUnit mengacu ke satu Unit.

### 5.7 Unit ↔ Rit
- Satu Unit bisa memiliki banyak Rit.
- Satu Rit milik satu Unit.

### 5.8 Unit ↔ Delay
- Satu Unit bisa memiliki banyak Delay.
- Satu Delay bisa terkait ke satu Unit (untuk delay per unit) atau null untuk fleet-wide.

### 5.9 Unit ↔ Maintenance
- Satu Unit bisa memiliki banyak Maintenance.
- Satu Maintenance milik satu Unit.

### 5.10 Unit ↔ BBMLog
- Satu Unit bisa memiliki banyak BBMLog.
- Satu BBMLog milik satu Unit.

### 5.11 Unit ↔ ActualStatus
- Satu Unit punya banyak ActualStatus (per tanggal).
- Satu ActualStatus milik satu Unit.

---

## 6. Hubungan User & Approval

### 6.1 User ↔ Shift
- Satu User bisa menutup banyak Shift.
- Satu User bisa approve banyak Shift.
- Satu Shift punya satu closedBy dan satu approvedBy opsional.

### 6.2 User ↔ Approval
- Satu User bisa membuat banyak Approval.
- Satu Approval milik satu User.

### 6.3 User ↔ EditRequest
- Satu User bisa mengajukan banyak EditRequest.
- Satu User bisa review banyak EditRequest.
- Satu EditRequest punya satu dibuatBy dan satu reviewedBy opsional.

### 6.4 Shift ↔ Approval
- Satu Shift bisa memiliki banyak Approval.
- Satu Approval terkait ke satu Shift.

---

## 7. Penjelasan Entitas Detail

### 7.1 Branch
Atribut utama:
- id
- kode
- nama
- skemaTimbangan
- aktif
- createdAt
- updatedAt

Fungsi:
- mewakili wilayah operasi / project / branch yang menjalankan hauling.

### 7.2 TipeUnit
Atribut utama:
- id
- kode
- nama
- kapasitasTon
- budgetBreakdownJam
- budgetLton
- budgetLjam
- budgetKmL
- targetRevenue
- aktif

Fungsi:
- mendefinisikan klasifikasi unit seperti DT Kecil, DT Besar.

### 7.3 Unit
Atribut utama:
- id
- kode
- polisi
- noRangka
- noMesin
- tahun
- kapasitas
- tipeId
- branchId
- budgetBreakdownJam
- aktif

Fungsi:
- merepresentasikan armada operasional nyata.

### 7.4 Operator
Atribut utama:
- id
- nama
- nik
- telepon
- sim
- tglLahir
- tglBergabung
- kontakDarurat
- branchId
- aktif

Fungsi:
- data pegawai/operator yang bertugas mengoperasikan unit.

### 7.5 Material
Atribut utama:
- id
- nama
- kode
- kategori
- satuan
- targetProduksiBulanan
- aktif

Fungsi:
- material hasil tambang yang diangkut, misalnya Nikel OB, Nikel ORE.

### 7.6 LokasiPit
Atribut utama:
- id
- nama
- kodeArea
- materialDominan
- jarakKeROM
- aktif

Fungsi:
- lokasi loading / pit.

### 7.7 LokasiStockpile
Atribut utama:
- id
- nama
- kode
- kapasitasTon
- aktif

Fungsi:
- lokasi dumping / stockpile tujuan.

### 7.8 Rate
Atribut utama:
- id
- branchId
- tipeUnitId
- materialId
- pitId
- stockpileId
- rateRpPerTon
- berlakuDari
- berlakuSampai

Fungsi:
- tarif hauling per ton sesuai rute dan material.

### 7.9 NettoEstimasi
Atribut utama:
- id
- branchId
- tipeUnitId
- materialId
- nettoEstimasiTon
- faktorMuatan
- berlakuDari

Fungsi:
- acuan net ton jika branch memakai skema WITHOUT_TIMBANGAN.

### 7.10 DelayType
Atribut utama:
- id
- kode
- nama
- kategori
- scope
- budgetMenit
- kenaPA
- aktif

Fungsi:
- referensi jenis delay yang bisa dipakai di modul delay.

### 7.11 StatusOperation
Atribut utama:
- id
- kode
- nama
- group
- warna
- isPA
- isUA
- isProd
- urutan

Fungsi:
- definisi status operasional unit (Ready, Breakdown, Standby, dll).

### 7.12 Shift
Atribut utama:
- id
- tanggal
- tipe
- jamMulai
- jamSelesai
- branchId
- catatan
- status
- closedAt
- closedById
- approvedAt
- approvedById
- rejectReason

Fungsi:
- entitas utama harian untuk operasi.

### 7.13 ShiftUnit
Atribut utama:
- id
- shiftId
- unitId
- operatorId
- material
- statusAwal

Fungsi:
- menghubungkan unit yang aktif di shift tertentu.

### 7.14 Rit
Atribut utama:
- id
- noRit
- shiftId
- unitId
- operatorId
- pitId
- stockpileId
- material
- jumlahRit
- jarakKm
- grossKg
- tareKg
- nettoTon
- statusTimbangan
- estimasiTon
- catatan

Fungsi:
- data ritase operasional per trip.

### 7.15 Delay
Atribut utama:
- id
- shiftId
- delayTypeId
- scope
- unitId
- jamMulai
- jamSelesai
- durasiMenit
- keterangan

Fungsi:
- mencatat delay fleet-wide maupun per unit.

### 7.16 Maintenance
Atribut utama:
- id
- shiftId
- unitId
- jenis
- jamMulai
- jamSelesai
- durasiJam
- budgetJam
- keterangan
- partDiganti

Fungsi:
- mencatat downtime dan maintenance unit.

### 7.17 BBMLog
Atribut utama:
- id
- shiftId
- unitId
- operatorBbmId
- jamPengisian
- lokasi
- liter
- odometer
- hourMeter
- keterangan

Fungsi:
- pencatatan pengisian BBM per unit.

### 7.18 ActualStatus
Atribut utama:
- id
- unitId
- tanggal
- statusOpId
- catatan

Fungsi:
- status aktual unit per hari untuk actual operation.

### 7.19 Approval
Atribut utama:
- id
- shiftId
- tipe
- aksi
- catatan
- userId
- createdAt

Fungsi:
- menyimpan hasil persetujuan shift atau edit request.

### 7.20 EditRequest
Atribut utama:
- id
- tipe
- recordId
- field
- nilaiLama
- nilaiBaru
- alasan
- dibuatById
- status
- reviewedById
- catatanReview
- createdAt
- reviewedAt

Fungsi:
- alur perubahan data yang memerlukan review supervisor.

### 7.21 User
Atribut utama:
- id
- email
- password
- nama
- role
- branchId
- avatarUrl
- aktif
- lastLoginAt

Fungsi:
- akun pengguna sistem.

---

## 8. ERD Ringkas (Textual)

```text
Branch 1---N Unit
Branch 1---N Operator
Branch 1---N Shift
Branch 1---N Rate
Branch 1---N NettoEstimasi
Branch 1---N TargetProduksi
Branch 1---N TargetRevenue

TipeUnit 1---N Unit
TipeUnit 1---N Rate
TipeUnit 1---N NettoEstimasi
TipeUnit 1---N BudgetMaterialTarget

Material 1---N Rate
Material 1---N NettoEstimasi
Material 1---N BudgetMaterialTarget
Material 1---N TargetProduksi

LokasiPit 1---N Rit
LokasiStockpile 1---N Rit

Shift 1---N ShiftUnit
Shift 1---N Rit
Shift 1---N Delay
Shift 1---N Maintenance
Shift 1---N BBMLog
Shift 1---N Approval

Unit 1---N ShiftUnit
Unit 1---N Rit
Unit 1---N Delay
Unit 1---N Maintenance
Unit 1---N BBMLog
Unit 1---N ActualStatus

Operator 1---N ShiftUnit
Operator 1---N Rit

DelayType 1---N Delay
StatusOperation 1---N ActualStatus

User 1---N Approval
User 1---N EditRequest (dibuatBy)
User 1---N EditRequest (reviewedBy)
User 1---N Shift (closedBy)
User 1---N Shift (approvedBy)
```

---

## 9. Alur Data Utama

### 9.1 Alur Shift
1. Admin membuka shift.
2. Sistem membuat record Shift dan ShiftUnit untuk unit yang terassign.
3. Unit dapat dipakai untuk Rit, Delay, Maintenance, BBM selama shift aktif.
4. Saat shift ditutup, status berubah menjadi pending approval.
5. Supervisor melakukan approve/reject.

### 9.2 Alur Rit
1. Data rit dibuat berdasarkan shift dan unit aktif.
2. Sistem menghitung netto berdasarkan gross dan tare bila skema timbangan aktif.
3. Bila skema WITHOUT_TIMBANGAN, netto menggunakan estimasi dari konfigurasi netto.
4. Jika data sudah approved, perubahan memerlukan edit request.

### 9.3 Alur Delay
1. Delay dibuat terhadap shift tertentu.
2. Jika scope fleet-wide, data terkait banyak unit.
3. Jika scope per unit, data terkait satu unit saja.
4. Sistem menghitung durasi dan membandingkan dengan budget.

### 9.4 Alur Maintenance
1. Maintenance dibuat per shift dan unit.
2. Sistem menghitung actual vs budget jam.
3. Jika full day breakdown, durasi otomatis terisi 10 jam.

### 9.5 Alur BBM
1. BBM log dibuat per unit dan shift.
2. Odometer/HM dibandingkan dengan data pengisian sebelumnya.
3. Ratio konsumsi BBM dihitung untuk analisa.

---

## 10. Catatan Implementasi Penting
- Semua transaksi operasional harus punya relasi ke Shift.
- Semua data yang memengaruhi approval harus punya audit trail.
- Hindari data duplikat antar modul; gunakan referensi ID.
- Untuk laporan, gunakan agregasi dari tabel transaksi, bukan tabel terpisah.
- Status operation dan delay type harus dikelola sebagai master data agar fleksibel.

---

## 11. Saran Implementasi Prisma
Untuk implementasi Prisma, struktur model sebaiknya mengikuti urutan:
1. Master data
2. User & auth
3. Shift dan transaksi operasional
4. Approval & audit
5. Budget & target
6. Laporan (computed view/query, bukan tabel terpisah)

---

## 12. Kesimpulan
ERD ini mencakup tiga lapisan data utama:
- master data untuk konfigurasi operasional,
- transaksi harian yang merekam aktivitas nyata,
- approval dan audit untuk validasi dan pelaporan.

Dengan struktur ini, sistem dapat mendukung dashboard, laporan, monitoring delay, maintenance, BBM, approval, dan analisa kinerja hauling secara terintegrasi.
