# Dashboard Daily Report — Pertanyaan Terbuka (untuk Klarifikasi Visual)

## Konteks

Dokumen ini adalah daftar hal yang **belum saya pahami** dari sheet referensi
`docs/daily_report_dashboard.html` (Site NPM, Juni 2026), setelah dibandingkan
dengan `docs/summary-operations-visual-spec.md` yang sudah lebih dulu ada.

Tujuan dokumen: bahan untuk digenerate jadi **visual/mockup oleh AI lain**, supaya
Anda bisa menjawab tiap poin lebih cepat lewat gambar dibanding teks panjang.

> Catatan istilah: spec lama memakai `surat_jalan`/`css/main.css` — di codebase
> saat ini istilahnya `Rit`/`styles.css`. Tidak mengubah makna, sekadar beda masa penulisan.

---

## A. Sudah terjawab (tidak perlu digambar ulang)

### A0. B1 — Asal angka Target harian (2026-07-08)

**Keputusan:** Target harian dihitung **otomatis**, turunan dari formula:

```
Produksi Plan (harian) = EWH per unit × Jumlah Unit Plan × Productivity
```

Ketiga input dasar ini (`EWH per unit`, `Jumlah Unit Plan`, `Productivity`) disimpan di
modul **Budget & Target** (bukan modul baru) sebagai nilai **versioned** — mirip pola
`Rate.berlakuDari`/`berlakuSampai` yang sudah ada — karena bisa berubah kapan saja di
tengah bulan, bukan nilai tunggal yang ditimpa.

Dari 3 input dasar itu diturunkan juga (kemungkinan versioned di tabel yang sama):
**DT Beroperasi Plan**, **Jam Tersedia Plan**, dan kemungkinan **PA%/UA% Plan**.

Breakdown & tiap jenis Delay **tetap** pakai `BudgetBreakdownUnit`/`DelayBudget` yang
sudah ada — tidak berubah oleh keputusan ini.

**Implikasi arsitektur:** 3 input dasar ini tetap disetel di **Budget & Target** (sesuai
prinsip "satu kesatuan utuh untuk semua setting nilai"). Modul **Analytic** (baru,
dibahas terpisah) bertugas **menghitung** Produksi/DT Beroperasi/Jam Tersedia/PA/UA Plan
harian dari 3 input itu secara on-demand — dan menghasilkan tabel raw (belum bentuk
dashboard) yang nantinya dikonsumsi visual.

Ringkasan lain dari spec lama, sebagai catatan silang:

- Formula EWH, PA, UA — bagian 6 spec lama.
- Threshold warna Ach: **≥100% hijau, 70–99% netral, <70% merah** (saya sempat salah asumsi 80% — dikoreksi).
- "Delay Tanpa Keterangan" bukan kategori delay asli — ini baris **self-check sistem** (harus selalu 0).
- Baris Breakdown & Total Standby Selain BD **tidak** punya baris Ach (tidak diberi warna).
- Produksi Total di grid harian tetap **gabungan** OB+ORE (tidak dipecah per material) — breakdown per material cukup di blok ringkasan MTD atas.
- Revenue **tidak** muncul di grid harian, hanya di blok ringkasan atas (Target Monthly).
- BBM ratio & Unit Ranking **di luar scope** modul ini (beda modul).
- Barging HGO/LGO ditandai sebagai **belum ada tabel sumber** — direkomendasikan input manual bulanan dulu (bukan breakdown harian).

### A1. B2, B3, B4, B7 — Rain, No Driver, Sunday Break, Istirahat & Jumat (2026-07-08, direvisi setelah re-cek data penuh)

**Keputusan tetap:** keempatnya murni `DelayType` biasa, masing-masing punya parameter &
budget sendiri lewat `DelayBudget` (per bulan per jenis) — mekanisme yang **sudah ada**,
tidak perlu model/skema baru.

**Revisi penting:** kesimpulan sebelumnya ("default pro-rata rata lurus, dugaan Jumat
belum terbukti") **saya tarik kembali** setelah menarik 30 hari penuh (sebelumnya cuma
9 dari ~34 kolom). Data lengkap justru **membuktikan** target harian TIDAK flat:

- **Istirahat & Jumat**: pola mingguan jelas — 34 (hari biasa), **51 di tiap hari Jumat**
  (hari 5,12,19,26), **17→17→11→9 di tiap hari Minggu** (hari 7,14,21,28, nilainya makin
  turun tiap minggu — belum tahu kenapa). **Aktual = Plan persis sama di semua 30 hari**
  — artinya kategori ini sepertinya item terjadwal tetap (bukan sesuatu yang "dicatat"
  operator per hari), Ach%-nya otomatis selalu 100%.
- **Sunday Break**: Plan hanya terisi di 4 hari Minggu (7,14,21,28) = 102, hari lain = 0.
  **Terbukti benar** dugaan B4 sebelumnya.
- **No Driver**: Plan kosong total (bukan 0) di semua hari — target memang **tidak
  diset** untuk kategori ini, Aktual kebetulan 0 sepanjang bulan di data contoh.
- **Rain**: Plan berubah per-blok (55 di hari 1-13, lalu 0/46/62/29/62/24/70 di
  sisanya), dengan pola turun spesifik tiap hari Minggu (0, 29, 24) — sepertinya
  budget bulanannya **direvisi beberapa kali di tengah bulan** (konsisten dengan
  konsep versioned di A0), bukan pro-rata rata dari 1 angka tunggal.

**Temuan tambahan (di luar 4 delay ini) yang memperkuat pola sama:** `Jam Tersedia Plan`
juga melompat dari 255 (hari 1-17) ke 320 (hari 18 ke atas, dengan 1 hari anomali 380 di
hari 22) — pola step-change ini cocok dengan hipotesis A0 bahwa `Jumlah Unit Plan`/`EWH per
unit` bisa berubah di tengah bulan (versioned). `Change Shift Plan` juga 0 di hari 1-17,
lalu jadi 23 (0 khusus hari Minggu) mulai hari 18.

**Kesimpulan baru:** target harian di seluruh matriks (bukan cuma delay) tampaknya
memang **weekday-aware + bisa direvisi di tengah bulan**, bukan pro-rata rata lurus
sederhana. Detail mekanismenya (apakah dari parameter `EWH per unit` yang disetel
beda per hari, atau lapisan lain) **belum saya pahami penuh** — ini jadi catatan
untuk rancangan modul Analytic nanti, tapi **tidak menghalangi** pembuatan UI
sekarang karena UI cukup menampilkan Aktual/Plan/Ach apa adanya, terlepas dari
bagaimana Plan-nya dihasilkan di balik layar.

### A2. B5 — Definisi "DT Beroperasi" Aktual (2026-07-08)

**Keputusan:** DT Beroperasi = unit berstatus **Ready** yang punya **muatan/ritase**
hari itu.

**Implementasi:** field `Unit.status` di schema ternyata cuma snapshot kondisi *saat
ini* (diedit manual di Master Data), bukan histori per-tanggal — tidak bisa dipakai
untuk pertanyaan "apakah unit ini Ready pada tanggal lampau". Yang punya jejak
historis per-tanggal adalah `Maintenance` (breakdown/pm dengan tanggal, sudah dipakai
untuk hitung PA). Jadi definisi praktisnya:

```
DT Beroperasi (hari X) = unit TANPA record Maintenance (breakdown/pm) aktif hari X
                          DAN punya ≥1 Rit tercatat hari X
```

Tidak perlu skema baru — tinggal kombinasi query `Maintenance` + `Rit` yang sudah
dipakai di `dashboard-daily.routes.ts`.

---

## B. Masih terbuka — perlu keputusan/klarifikasi Anda

### B6. Kolom "Total Bulan" untuk metrik rasio (PA%/UA%/DT Beroperasi) — DI-HOLD

Untuk metrik seperti tonase/menit, "Total Bulan" jelas = jumlah semua hari. Tapi untuk PA%/UA%,
menjumlahkan persentase harian tidak masuk akal.

**Skenario untuk digambar:** kolom Total di ujung kanan — versi (a) rata-rata sederhana dari 30 nilai
harian, versi (b) dihitung ulang dari total pembilang/penyebut sebulan penuh (biasanya beda angkanya
dari rata-rata sederhana).

> Status: **di-hold oleh user (2026-07-08)** — belum diputuskan, jangan diasumsikan dulu.

---

## C. Pertanyaan teknis tambahan (opsional, prioritas lebih rendah)

- ~~Kolom hari yang belum sepenuhnya saya baca~~ — **SELESAI (2026-07-08)**: sudah ditarik
  penuh 34 kolom. Konfirmasi: kolom 1-30 = tanggal, kolom terakhir = "JUNI TOTAL". Baris
  hari (row15) hanya melabeli **Jumat** dan **Minggu** secara eksplisit (hari 5/12/19/26 =
  Jumat, hari 7/14/21/28 = Minggu) — hari lain tidak dilabeli, konsisten dengan pola A1 di atas.
- **Warna asli sel** di file Excel/HTML sumber tidak ikut ter-ekstrak (saya hanya ambil teks) — jika
  Anda punya screenshot warna aslinya, itu bisa jadi referensi lebih akurat dibanding threshold
  70%/100% yang sudah ditulis di spec lama.
- **Aturan "hari shift tidak dibuka"** (section 3.4 spec lama, sel Aktual=0 tapi Target>0 → border merah)
  — data nyata mengonfirmasi ada hari begini (hari 11, 12, 16, 23 → Produksi/DT Beroperasi/EWH = 0
  padahal Plan > 0), tapi mekanisme deteksinya (dari absennya record `Shift` di tanggal itu, atau
  sesuatu yang lain) masih belum saya konfirmasi.

---

## Cara pakai dokumen ini

Update 2026-07-08: B1, B2, B3, B4, B5, B7 sudah terjawab. Yang tersisa cuma **B6**
(di-hold) dan 1 item teknis di bagian C (deteksi "hari shift tidak dibuka"). Tidak
ada lagi yang menghalangi pembuatan Artifact UI — sisa item bisa menyusul sambil
jalan.
