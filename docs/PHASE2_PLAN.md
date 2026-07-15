# HAULOPS — Rencana Development Phase 2

Dokumen ini merangkum modul/pekerjaan yang **sengaja ditunda** dari Phase 1 (fondasi +
seluruh modul operasional + master data + dashboard monitoring harian, lihat
`docs/TASKS.md` untuk riwayat lengkap), supaya mudah dilanjutkan tanpa perlu
menggali ulang konteks dari percakapan sebelumnya.

Status per 2026-07-07: **belum ada yang dikerjakan di Phase 2** — dokumen ini murni
rencana/briefing.

---

## 1. Permission Enforcement (Dynamic RBAC) — Prioritas Utama

### Kondisi sekarang
- Kontrol akses backend **hardcode** lewat `requireRole('role-a', 'role-b', ...)`
  ditulis manual di tiap endpoint — **~69 titik pemanggilan** tersebar di 8 file:
  `shift.routes.ts`, `rits.routes.ts`, `delay.routes.ts`, `maintenance.routes.ts`,
  `bbm.routes.ts`, `approvals.routes.ts`, `master.routes.ts` (paling banyak —
  termasuk yang dihasilkan factory generik `registerMonthlyMaster`),
  `operator-status.routes.ts`.
- Aturannya granular **per-aksi**, bukan cuma per-modul. Contoh nyata yang harus
  tetap terjaga saat migrasi: Shift "Approve/Reject" hanya Admin Mining+Supervisor
  (General Admin **tidak** termasuk, beda dengan "Buka/Tutup Shift" yang termasuk
  General Admin); Rit/Delay/Maintenance/BBM "Hapus" tidak termasuk Operator
  (meski create/edit boleh).
- **Sidebar frontend tidak difilter role sama sekali** — semua menu tampil ke semua
  user; yang membatasi cuma backend saat submit (403 setelah klik).
- Sudah ada tabel **referensi** `ModulePermission` (schema.prisma, diisi 2026-07-07)
  yang mendokumentasikan aturan di atas — tapi **belum dibaca oleh kode apa pun**,
  cuma untuk dilihat admin di Master Data → Permission.

### Scope Phase 2
Ganti hardcode `requireRole(...)` supaya membaca dari `ModulePermission.rolesAllowed`
secara dinamis, dan filter sidebar frontend berdasarkan permission yang sama.

### Pendekatan yang direkomendasikan (bertahap, bukan big-bang)
1. **Perluas granularitas tabel** — saat ini `ModulePermission` per-modul (sesuai
   keputusan "referensi dulu, per-modul" 2026-07-07). Untuk enforcement sungguhan,
   pertimbangkan apakah perlu naik ke per-aksi (`moduleKode` + `aksi` seperti
   `rit.delete` vs `rit.create`) supaya nuansa yang ada sekarang (lihat contoh di
   atas) tidak hilang. Ini keputusan desain yang perlu disepakati ulang dengan user
   sebelum implementasi — **jangan asumsikan per-modul cukup**.
2. **Middleware baru** `requirePermission(moduleKode, aksi?)` menggantikan
   `requireRole(...)` — query `ModulePermission` (dengan cache in-memory + TTL
   pendek, supaya tidak query DB di setiap request) lalu cek `role` user ada di
   `rolesAllowed`.
3. **Fail-closed sebagai default**: kalau suatu `moduleKode`/aksi belum ada baris
   permission-nya, tolak akses (bukan izinkan) — mencegah lubang keamanan akibat
   baris yang lupa di-seed.
4. **Migrasi per file, satu-satu** — jangan ganti 69 titik sekaligus. Urutan
   disarankan dari risiko terendah: `operator-status.routes.ts` (baru, 2 titik) →
   `approvals.routes.ts` (4 titik) → `shift.routes.ts` → dst → `master.routes.ts`
   (paling banyak & paling kritis, terakhir). Jalankan test suite penuh + smoke
   test manual per role setelah **setiap** file selesai dimigrasi.
5. **Sidebar frontend**: fetch `/master/module-permissions` saat login, sembunyikan
   `navGroups` item yang role user tidak punya akses (companion langsung dari
   langkah di atas — tidak berguna menegakkan backend kalau UI masih menampilkan
   tombol yang akan di-403).
6. **Verifikasi**: 52 test backend yang ada harus tetap hijau di tiap tahap, plus
   tambahan test per role (mis. login sebagai `operator`, pastikan masih bisa
   create rit tapi tidak bisa delete).

### Risiko & mitigasi
Ini security-critical — kesalahan bisa **membuka** akses yang harusnya tertutup,
atau **mengunci** user yang sah. Rekomendasi kuat: masuk **Plan Mode** dulu sebelum
eksekusi (bukan langsung coding), dan pertimbangkan feature-flag/rollout bertahap
per role/modul di production nanti (bukan aktifkan semua sekaligus).

---

## 2. Auth Hardening — SELESAI (2026-07-08)

Dibenahi saat persiapan deployment:
- **Password kini di-hash bcrypt** (`src/auth.util.ts` `hashPassword`/`verifyPassword`,
  bcryptjs, 10 rounds) di semua titik tulis (login upgrade, register, master user
  create/reset, bootstrap, seed, global-setup). Password lama plaintext **ter-upgrade
  otomatis** saat login sukses (jalur `legacy`) — tak perlu migrasi manual.
- **Token kini JWT** ditandatangani `JWT_SECRET` + `JWT_EXPIRES_IN` (`signToken`/
  `verifyToken`); middleware `requireAuth` verifikasi tanda tangan, tolak invalid/
  kadaluarsa → 401. `render.yaml` sudah `generateValue: true` untuk JWT_SECRET.
- **User nonaktif ditolak login** (dan token untuk user dihapus/nonaktif → 401).
- Revokasi token (logout) tetap in-memory `revokedTokens` — cukup untuk 1 instance
  Render; catatan: hilang saat restart & tak lintas-instance (belum perlu sekarang).
- Verifikasi: 72 test hijau (+3 auth), E2E dev DB: login plaintext lama sukses →
  JWT + password ter-upgrade ke `$2b$...` di DB; token dipalsukan/invalid → 401.

Fondasi auth sekarang layak untuk menegakkan permission (#1).

---

## 3. Dashboard Daily Report (matriks bulanan) — DISKUSI DILANJUTKAN (2026-07-08)

Sempat **di-hold**, lalu dilanjutkan lagi oleh user ("coba kita diskusikan kembali
dashboard daily report matrix yang di hold"). Pendekatan UI-first sudah dilakukan
(2 opsi mockup dibuat via Artifact, user memilih **Opsi A — mengikuti sheet asli**).
Detail pertanyaan terbuka & progres jawabannya dipindah ke dokumen terpisah:
`docs/dashboard-daily-open-questions.md` (jangan duplikasi di sini, itu sumber
kebenaran yang lebih hidup/sering diupdate selama diskusi berlangsung).

**Arsitektur baru yang disepakati (2026-07-08):** dipecah jadi 2 lapisan —
1. **Budget & Target** (sudah ada) tetap satu-satunya tempat *setting nilai*,
   termasuk 3 input dasar baru (`EWH per unit`, `Jumlah Unit Plan`, `Productivity`)
   yang perlu **versioned** seperti pola `Rate.berlakuDari/berlakuSampai`.
2. **Modul "Analytic"** (baru, belum diimplementasi) — layer komputasi *on-demand*
   (bukan tabel snapshot baru) yang menggabungkan Aktual (Rit/Delay/Maintenance/
   ShiftUnit) + Budget & Target, lalu menghasilkan **raw data** (belum bentuk
   dashboard) siap dikonsumsi visual. Menata ulang fungsi yang sudah ada di
   `dashboard-daily.routes.ts` (`computeAvailability`, `aggregateProduction`, dst)
   jadi endpoint tersendiri, bukan bangun dari nol.

**Jangan mulai implementasi kode sampai rancangan modul Analytic (skema
endpoint/response) dibahas & disepakati.**

### Modul Analytic — Iterasi 1 (backend) SELESAI (2026-07-08)

Backend layer komputasi sudah dibangun & terverifikasi (tsc bersih, 69 test hijau,
E2E curl Project NPM cocok). Yang sudah ada:
- Model `BasisTargetProduksi` (versioned, scope branch+tipeUnit+material) + migrasi
  `add_basis_target_produksi`.
- `src/analytic-core.ts` — agregator murni dipindah dari `dashboard-daily.routes.ts`
  (dipakai bersama, dashboard import dari sini) + `resolveBasis()` & `computeDtBeroperasi()`.
- CRUD `/api/v1/master/basis-target-produksi` (gaya Rate) di `master.routes.ts`.
- `GET /api/v1/analytic/daily?branchId&bulan&tahun` (`src/analytic.routes.ts`) →
  raw data harian sebulan: `produksi{planTon,aktualTon}`, `dtBeroperasi{plan,aktual}`,
  `availability{paPct,uaPct,ewhJam,jamTersediaJam,breakdownJam}`, `basisTerpakai[]`, `noData`.

### Modul Analytic — Iterasi 2 (frontend) SELESAI (2026-07-08)

Frontend dibangun & lulus `npm run build` (tsc + vite). Yang sudah ada:
- Kartu **"9. Input Dasar Target Produksi (Versioned)"** di Master Data → Budget &
  Target (komponen `MasterBasisTargetProduksi`, pola versioned ala `MasterRates`;
  CRUD + filter per branch + preview "Produksi Plan/hari" = ewh×unit×prod).
- Halaman/menu **"Analytic"** baru (grup Monitoring, `RouteKey 'analytic'`,
  `AnalyticPage`) — viewer tabel raw data harian dari `/analytic/daily`: Produksi
  Target/Aktual/Ach%, DT Beroperasi plan/aktual, PA/UA/EWH/Jam Tersedia/Breakdown,
  caption input dasar terpakai, baris "hari hilang data" (noData) ditandai merah + ⚠.
- CSS `.analytic-table` di `styles.css`.

### Modul Analytic — Iterasi 3: Dashboard Daily Report + dummy data (2026-07-08) SELESAI

- Endpoint `/analytic/daily` diperluas: tiap hari kini menyertakan `delays[]`
  (per DelayType: actual+target menit, dari DelayBudget bulanan / jumlah hari)
  dan `totalStandbyMin` (Σ semua delay). Regres 69 test tetap hijau.
- Halaman **"Daily Report"** baru (grup Monitoring, `RouteKey 'daily-report'`,
  komponen `DashboardDailyReport`) — matriks Opsi A (mirror sheet): metrik ×
  hari, sub-baris Aktual/Target/Ach% berwarna (hijau ≥100 / kuning 80-99 /
  merah <80), kolom sticky, Jumat/Minggu ditandai, kolom Total, baris delay
  per jenis. CSS `.ddr-*` di `styles.css`.
- **Dummy data Juni 2026 Project NPM** (via API, script scratchpad
  `gen-npm-june.mjs`): 15 unit + 15 operator, input dasar (plan 4800 ton/hari,
  DT plan 10), 60 shift (pagi+malam, semua di-approve), 705 rit, 160 delay, 39
  breakdown. Fluktuatif & realistis: Produksi Ach 34-113%, PA 96-100%, UA
  28-69%, MTD 77%. Catatan: rit harus di-POST **sekuensial** (noRit di-generate
  berurutan di server; POST paralel menabrakkan unique noRit — latent bug ringan
  yang hanya muncul saat bulk-insert, bukan pemakaian UI normal).

Mockup UI dibuat via Artifact (2 panel: "Input Dasar (Versioned)" + "Raw Data
Turunan") dan disetujui strukturnya. Keputusan tambahan dari sesi ini:

- **Scope 3 input dasar**: per **Branch + Tipe Unit + Material** (dikonfirmasi
  user — "target dan budget untuk jenis material juga berbeda"). Jadi model
  versioned baru butuh kombinasi ke-3 dimensi ini, bukan cuma Branch+Tipe Unit.
- **Formula final, EWH & UA% (Aktual) — dikonfirmasi user benar:**
  ```
  EWH Aktual   = Jam Tersedia Aktual − Breakdown Aktual − Total 7 Delay Aktual (kenaPA=false)
  UA% Aktual   = EWH Aktual / (Jam Tersedia Aktual − Breakdown Aktual) × 100%
  Jam Tersedia Aktual = Σ durasi shift × jumlah unit ter-assign (Shift + ShiftUnit)
  Breakdown Aktual    = jam dari Maintenance (jenis breakdown + pm)
  Total 7 Delay       = Σ menit Delay dengan kenaPA=false (Rain, No Driver,
                        Delay Tanpa Keterangan, Istirahat & Jumat, Change Shift,
                        P5M/P2H/Perbaikan LP, Sunday Break)
  ```
  Tidak ada input baru untuk hitungan Aktual — semua dari data operasional yang
  sudah ada (`Shift`, `ShiftUnit`, `Maintenance`, `Delay`).
- **EWH Plan** BUKAN turunan (bukan Jam Tersedia Plan − delay Plan) — ini salah
  satu dari 3 input dasar yang diset manual per versi.
- **Productivity** tidak punya komponen turunan — angka atomik (ton/jam) yang
  diinput langsung, merepresentasikan faktor dunia nyata (jarak angkut, cycle
  time, densitas material) yang tidak dicatat sebagai field terpisah di HAULOPS.
- Produksi Plan harian = **jumlah** hasil komputasi tiap kombinasi Material yang
  aktif hari itu (mis. OB + ORE dijumlah) — tetap gabungan di grid Dashboard,
  konsisten dengan keputusan sebelumnya (Produksi Total tidak dipecah per
  material di tampilan harian, breakdown per material cukup di ringkasan MTD).

### Referensi
User menunjuk `docs/daily_report_dashboard.html` (export sheet Google Sheets) —
sudah dibedah strukturnya: 1 tabel besar, section atas = **SUMMARY MTD** (Plan/
Aktual/Ach% per parameter: Produksi OB/ORE, Barging HGO/LGO, Total Revenue, PA, UA),
section bawah = **detail harian** (baris = parameter/metrik, kolom = tanggal 1-30/31
+ kolom "JUNI TOTAL"), dengan sub-baris Aktual & Plan per parameter.

### Poin yang sudah disepakati sebelum hold
- **Semua kata "Plan" di sheet = "Target"/"Budget"** di bahasa sistem HAULOPS
  sekarang — jadi selalu ada perbandingan Aktual vs Plan(Target/Budget), konsisten
  dengan pola yang sudah dipakai di modul Budget & Target dan Dashboard Monitoring
  Harian.
- **Plan Produksi** diturunkan dari 3 input dasar: `EWH per unit × Jumlah Unit Plan
  × Productivity`. Ketiga input ini bisa berubah kapan saja → perlu **histori/
  versioned** (mirip pola `Rate.berlakuDari`/`berlakuSampai`), bukan nilai tunggal
  yang ditimpa.
- Dari 3 input dasar itu diturunkan (kemungkinan juga perlu versioned di tabel yang
  sama): **DT Beroperasi Plan**, **Jam Tersedia Plan**, **Produksi Plan**, dan
  mungkin **PA%/UA% Plan**.
- **Breakdown & tiap jenis Delay** tetap pakai `BudgetBreakdownUnit`/`DelayBudget`
  yang sudah ada — tidak perlu model baru untuk ini.
- Jenis delay baru yang perlu ditambahkan ke master `DelayType` (ditemukan dari
  baris-baris di sheet referensi): "Istirahat & Jumat", "P5M/P2H/Perbaikan LP",
  "Sunday break", "Delay tanpa keterangan".
- **"Barging HGO/LGO"** di sheet ternyata **bukan konsep baru** — itu adalah
  material yang sama seperti OB/ORE (sudah ada di master Material), bukan entitas
  terpisah yang perlu dimodelkan.

### Yang masih terbuka (tunggu jawaban user)
- Bentuk UI final: ikut visual sheet asli (matriks padat baris×kolom) atau
  direkomendasikan ulang jadi lebih ringkas/modern (user membuka opsi ini di
  permintaan awal: "jika ada rekomendasi untuk UX yang lebih mantap boleh berikan
  saran").
- Apakah ini benar-benar modul terpisah dari Dashboard Monitoring Harian yang sudah
  ada (user sempat bilang "saya butuh modul... terpisah dari dashboard existing"),
  atau bisa jadi tab tambahan di sana.
- Detail lengkap semua parameter yang perlu masuk matriks (baru sebagian ter-audit
  dari sheet: Produksi OB/ORE, Revenue, PA, UA — sheet punya lebih banyak baris
  yang belum ditelusuri detail nilainya).

---

## 4. Wiring yang SUDAH selesai (jangan dikerjakan ulang)

Item ini sebelumnya tercatat "belum dikerjakan" di `docs/TASKS.md` tapi sudah
selesai lewat pembangunan **Dashboard Monitoring Harian** (`dashboard-daily.routes.ts`,
2026-07-07) — dicatat di sini agar tidak dobel-kerja di Phase 2:

- ✅ **Delay budget per bulan → Dashboard**: `GET /dashboard/daily` menghitung
  delay aktual vs `DelayBudget` (harian pro-rata + akumulasi bulanan).
- ✅ **Hauling Rate → Revenue di Dashboard**: `resolveRate()` di
  `dashboard-daily.routes.ts` mencari `Rate` berlaku per rit (branch+tipeUnit+
  material+pit/stockpile+tanggal) dan menghitung revenue otomatis.

---

## Referensi cepat
- Riwayat lengkap Phase 1: `docs/TASKS.md`
- Sistem desain (token warna, tipografi, komponen): `docs/DESIGN.md`
- Model referensi permission (belum enforcement): `ModulePermission` di
  `scaf/packages/server/prisma/schema.prisma`
- Sheet referensi Dashboard Daily Report: `docs/daily_report_dashboard.html`
