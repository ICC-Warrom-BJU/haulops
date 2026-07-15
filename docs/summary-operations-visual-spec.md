# Spesifikasi Visual — Modul "Summary Operations"

## Konteks

Modul ini adalah laporan tracking harian bulanan yang menggantikan format Excel manual yang selama ini dipakai tim mining. Tujuannya menampilkan **Aktual vs Plan vs Achievement** untuk setiap metrik operasional, per hari, dalam satu bulan penuh — termasuk breakdown waterfall dari Jam Tersedia menjadi EWH.

Referensi asli: dua sheet Excel —
1. **Summary Operations** (Produksi Total, DT Beroperasi, PA, UA)
2. **Jam Kerja** (Jam Tersedia → EWH, breakdown 7 kategori delay)

Modul ini ditempatkan di **Laporan → Rekap Bulanan**, sebagai tampilan tambahan/alternatif dari rekap bulanan yang sudah ada (chart trend harian), karena formatnya lebih detail dan granular per hari.

---

## 1. Struktur Layout Umum

### 1.1 Bentuk Tabel
- **Grid matrix**: baris = metrik, kolom = tanggal (1–31, otomatis sesuai jumlah hari di bulan terpilih).
- Kolom terakhir = **Total Bulan** (sticky, selalu terlihat saat scroll horizontal).
- Kolom pertama = **Label Item** (sticky kiri, selalu terlihat saat scroll horizontal).
- Tabel di-scroll horizontal jika lebar konten melebihi viewport — bukan wrap atau redesign ke vertical card.

### 1.2 Pengelompokan Section
Ada 2 section besar dalam satu halaman, masing-masing scrollable secara independen secara visual tapi tetap 1 tabel:

**Section A — Summary Operations**
| Group | Metrik di dalamnya |
|---|---|
| Produksi Total | Aktual, Plan, Ach (%) |
| DT Beroperasi | Aktual, Plan, Ach (%) |
| PA | Aktual, Plan, Ach (%) |
| UA | Aktual, Plan, Ach (%) |

**Section B — Jam Kerja (Waterfall EWH)**
| Group | Metrik di dalamnya |
|---|---|
| Jam Tersedia | Aktual, Plan |
| EWH | Aktual, Plan, Ach (%) |
| Breakdown | Aktual, Plan |
| Total Standby selain BD | Aktual, Plan |
| 1. Rain | Aktual, Plan |
| 2. No Driver | Aktual, Plan |
| 3. Delay Tanpa Keterangan | Aktual, Plan — **lihat catatan khusus di bagian 5** |
| 4. Istirahat & Jumat | Aktual, Plan |
| 5. Change Shift | Aktual, Plan |
| 6. P5M, P2H, Perbaikan LP | Aktual, Plan |
| 7. Sunday Break / Holiday Break | Aktual, Plan |

> Catatan: di section B, setiap kategori delay (1–7) di-generate otomatis dari Master Delay Types yang `kena_pa_ua = true` atau yang dikonfigurasi termasuk dalam grup "Standby". Urutan dan penomoran ikut urutan field `urutan` di master data — tidak hardcode.

---

## 2. Setiap Grup Metrik = 3 Sub-Baris (atau 2 untuk yang tidak punya Plan-comparison eksplisit)

```
[Nama Grup]
  Aktual   |  val1 | val2 | val3 | ... | Total
  Plan     |  val1 | val2 | val3 | ... | Total   ← warna abu/pudar (lihat 3.2)
  Ach      |  61%  | 70%  | 82%  | ... | Total   ← background conditional (lihat 3.3)
```

- Baris **Aktual**: angka normal, warna teks gelap, font-weight medium-bold.
- Baris **Plan**: angka warna abu pudar (`color: var(--text-muted)` atau setara opacity 60%), font-weight normal — secara visual jelas "lebih ringan" dari Aktual.
- Baris **Ach**: hanya muncul untuk grup yang formula-nya make sense dibandingkan ke persentase (Produksi, DT Beroperasi, PA, UA, EWH). Untuk grup breakdown delay individual (Rain, No Driver, dst), baris Ach **tidak ditampilkan** — cukup Aktual & Plan.

---

## 3. Aturan Warna (Conditional Formatting)

### 3.1 Header Tabel
- Baris header (nomor tanggal 1–31 + "JUNI TOTAL"): background hijau tua (`#1F6B3A` atau setara brand `--brown-dark` jika ingin konsisten dengan tema HAULOPS), teks putih bold.
- Kolom tanggal "hari ini" (jika bulan sedang berjalan) diberi border highlight biru tegas di sekeliling sel header-nya saja (lihat referensi: kolom "5" punya border biru di gambar asli).

### 3.2 Baris Plan
- Selalu warna teks pudar/abu, tidak pernah diberi background conditional warna apapun.

### 3.3 Baris Ach (%) — Conditional Background
| Kondisi | Warna Background | Warna Teks |
|---|---|---|
| Ach ≥ 100% | Hijau pastel (`#C8E6D5` / setara `--status-approved`) | Hijau tua |
| Ach 70%–99% | Tidak diberi warna (putih/transparan) | Hitam/default |
| Ach < 70% | Merah pastel (`#F8D0D3` / setara `--status-rejected`) | Merah tua |
| Ach = 0% (dan ada Plan > 0) | Merah pastel lebih pekat — **flag visual tambahan** ikon ⚠ kecil di pojok sel | Merah tua |

> Threshold 70% adalah default yang bisa dikonfigurasi per metrik di masa depan (out of scope untuk versi pertama — hardcode dulu).

### 3.4 Sel dengan Nilai 0 yang Mencurigakan
- Jika **Aktual = 0** pada baris Produksi Total / DT Beroperasi / PA / UA / EWH **TAPI** Plan pada hari yang sama > 0 → beri border merah tebal di sekeliling sel tersebut (bukan fill, supaya tidak konflik dengan conditional Ach). Ini menandakan "hari hilang data" yang perlu investigasi (lihat temuan tanggal 11–12 di referensi).
- Tooltip on-hover untuk sel ini: *"Tidak ada data tercatat — periksa apakah shift dibuka pada tanggal ini."*

### 3.5 Sel Total Bulan (Kolom Terakhir)
- Background sedikit lebih gelap dari kolom biasa (untuk membedakan secara visual sebagai "ringkasan"), border kiri tebal untuk memisahkan dari kolom tanggal harian.
- Tetap mengikuti aturan warna conditional yang sama seperti 3.3 untuk baris Ach.

---

## 4. Ikon per Kategori Delay (Section B)

Setiap baris kategori delay (1–7) punya ikon kecil di kolom label, sebelum nama kategori:

| Kategori | Ikon Disarankan |
|---|---|
| Breakdown | 🔧 |
| Total Standby selain BD | ⏸ atau ⏱ |
| Rain | 🌧 |
| No Driver | 👤🚫 atau 🪪 |
| Delay Tanpa Keterangan | ⚠ (highlight khusus — lihat bagian 5) |
| Istirahat & Jumat | 🍽 |
| Change Shift | 🔄 |
| P5M, P2H, Perbaikan LP | 🦺 |
| Sunday/Holiday Break | 📅 |

Ikon ditampilkan sebagai prefix kecil (16px) di kiri label, sejajar vertikal dengan label teks, tidak mengganggu alignment angka di kanan.

---

## 5. Catatan Khusus — "Delay Tanpa Keterangan"

**Keputusan bisnis:** kategori ini **tidak boleh muncul sebagai opsi input** di sistem HAULOPS (berbeda dari Excel lama yang masih mengizinkan delay tanpa kategori jelas). Setiap delay yang diinput WAJIB memilih salah satu Delay Type dari master data.

Namun, baris ini **tetap ditampilkan di visual** sebagai kategori "agregat otomatis" yang menangkap:
- Selisih perhitungan jika `Total Standby selain BD` (dihitung dari shift close) tidak sama dengan SUM seluruh delay yang sudah dikategorikan dengan benar.
- Ini berfungsi sebagai **self-check validation** — jika baris ini menunjukkan angka > 0 secara konsisten, berarti ada bug di kalkulasi sistem atau delay yang ter-input tapi tidak match ke kategori manapun (seharusnya tidak mungkin terjadi by design, tapi disediakan sebagai safety net visual).
- Beri badge khusus di label baris ini: `⚠ Selisih Sistem` dengan warna kuning/amber, dan tooltip: *"Nilai ini seharusnya 0. Jika tidak, hubungi admin sistem untuk audit data delay."*

---

## 6. Formula per Metrik

```
EWH = Jam Tersedia − Breakdown − Total Standby Selain BD

Total Standby Selain BD = SUM(Rain, No Driver, Delay Tanpa Keterangan,
                               Istirahat & Jumat, Change Shift,
                               P5M/P2H/Perbaikan LP, Sunday Break)

Ach (%) = (Aktual / Plan) × 100%

PA (%) = (Total Jam Tersedia − Breakdown) / Total Jam Tersedia × 100%
         [catatan: definisi ini sedikit berbeda dari PRD awal yang
          juga mengurangi PM — sesuaikan dengan data referensi jika
          PM digabung ke dalam "Breakdown" di laporan ini]

UA (%) = EWH / (Jam Tersedia − Breakdown) × 100%

Cycle Time (laporan baru) = EWH / Jumlah Rit
```

> Semua formula menggunakan data yang sudah tersimpan di tabel `shifts`, `maintenance_logs`, `delays`, dan `surat_jalan` (lihat PRD v1.1 Section 9). Tidak ada tabel baru yang diperlukan — ini murni layer visualisasi dan agregasi.

---

## 7. Interaksi & Filter

- Filter di atas tabel: **Branch**, **Bulan**, **Tahun**. (Tidak perlu filter per-unit di level ini — ini adalah summary level branch, bukan per unit. Drill-down per unit ada di laporan harian yang sudah ada.)
- Klik pada sel tanggal manapun → tampilkan tooltip/popover kecil berisi breakdown detail hari itu (opsional, nice-to-have, bukan must-have di versi pertama).
- Tombol **Export Excel** mengikuti format visual yang sama (termasuk conditional formatting warna) — bukan hanya raw data tanpa styling.
- Header tanggal yang merupakan "hari ini" (jika filter bulan = bulan berjalan) selalu di-highlight border biru otomatis tanpa perlu interaksi user.

---

## 8. Responsive / Scroll Behavior

- Kolom pertama (Label Item) dan kolom terakhir (Total Bulan) **sticky** saat scroll horizontal — selalu terlihat di kiri dan kanan.
- Baris header (nomor tanggal) **sticky** saat scroll vertical — selalu terlihat di atas saat scroll ke bawah melihat section B.
- Di layar sempit (tablet/mobile), tabel tetap dalam mode scroll horizontal — TIDAK di-collapse menjadi card per tanggal (akan kehilangan kemampuan compare antar hari yang jadi inti value laporan ini).

---

## 9. Komponen Tambahan di Atas Tabel (Page Header Area)

```
┌─────────────────────────────────────────────────────────┐
│  Summary Operations & Jam Kerja                          │
│  Rekap harian Aktual vs Plan — Juni 2026, Branch Kal. A   │
│                                                           │
│  [Filter: Branch ▾] [Filter: Bulan ▾] [Filter: Tahun ▾]  │
│                                          [⬇ Export Excel] │
└─────────────────────────────────────────────────────────┘
```

Di bawah filter, **sebelum** tabel waterfall utama (section A & B), tambahkan **section paling atas** sesuai detail di bagian 9A berikut. Setelah section 9A, baru lanjut ke **4 KPI ringkas** sebagai card kecil (konsisten dengan pola `stat-card` yang sudah ada di sistem):
- Achievement Produksi Bulanan (%)
- Achievement UA Bulanan (%)
- Total Hari dengan Aktual = 0 (flag merah jika > 0)
- Total "Delay Tanpa Keterangan" bulanan (harus 0 — flag amber jika > 0)

---

## 9A. Section Paling Atas — "Ringkasan MTD & Target Bulanan"

Section ini adalah baris pertama yang dilihat user saat membuka modul Summary Operations — berfungsi sebagai *executive snapshot* sebelum user scroll ke tabel detail harian (Section A & B). Terdiri dari **3 blok berdampingan** dalam 1 row, proporsi lebar kira-kira 22% / 28% / 50%.

```
┌──────────────────┐  ┌──────────────────────┐  ┌─────────────────────────────────┐
│  SUMMARY MTD      │  │  TARGET MONTHLY        │  │  Produksi Harian (Line Chart)    │
│  (card kecil)     │  │  (card kecil)           │  │  (chart area, lebih lebar)        │
└──────────────────┘  └──────────────────────┘  └─────────────────────────────────┘
```

Di layar sempit (tablet), 3 blok ini stack vertikal penuh lebar, urutan tetap: Summary MTD → Target Monthly → Produksi Harian.

### 9A.1 Blok 1 — "Summary MTD"

Tabel kecil 4 kolom: **Label | Plan | Aktual | Ach%**

| Baris | Plan | Aktual | Ach% |
|---|---|---|---|
| OB | ✅ ada | ✅ ada | ✅ dihitung |
| ORE | ✅ ada | ✅ ada | ✅ dihitung |
| *(baris kosong/spacer)* | — | — | — |
| Barging HGO | ❌ kosong | ✅ ada | ❌ kosong |
| Barging LGO | ❌ kosong | ✅ ada | ❌ kosong |
| *(baris kosong/spacer)* | — | — | — |
| PA | ✅ ada | ✅ ada | ❌ kosong |
| UA | ✅ ada | ✅ ada | ❌ kosong |

**Aturan tampilan:**
- Header tabel (judul "SUMMARY MTD" + baris "PLAN / AKTUAL / ACH%") berwarna hijau tua (`--brown-dark` atau hijau gelap sesuai referensi asli), teks putih bold.
- Baris label kiri (OB, ORE, Barging HGO, dst) punya background hijau muda pastel, bold.
- Kolom Ach% memakai conditional formatting yang **sama persis** dengan aturan di bagian 3.3 (merah jika <70%, hijau jika ≥100%, transparan jika 70–99%).
- Baris **PA** dan **UA** di blok ini adalah ringkasan MTD (Month To Date) dari metrik yang sama yang sudah dijelaskan di Section A tabel utama — bukan data baru, hanya representasi ringkas di posisi atas.
- Baris dengan sel kosong (Plan untuk Barging, Ach% untuk PA/UA) ditampilkan sebagai sel putih polos tanpa border tebal — bukan dash atau "N/A", cukup kosong senada dengan referensi Excel asli.
- "Barging HGO" dan "Barging LGO" adalah data baru (bukan dari Material OB/ORE) — kemungkinan terkait pengiriman via tongkang/barge. **Perlu konfirmasi ke tim:** apakah ini perlu modul/tabel data tersendiri (`barging_logs`) atau sekadar manual entry ringkasan bulanan tanpa breakdown harian. **Rekomendasi versi pertama:** treat sebagai manual input bulanan sederhana (lihat 9A.4).

### 9A.2 Blok 2 — "Target Monthly"

Tabel kecil 4 kolom: **DESC | Plan | Aktual | Ach**

| Baris | Plan | Aktual | Ach |
|---|---|---|---|
| Produksi OB | ✅ | ✅ | ❌ kosong |
| Produksi ORE | ✅ | ✅ | ❌ kosong |
| Barge HGO | ❌ kosong | ✅ | ❌ kosong |
| Barge LGO | ❌ kosong | ✅ | ❌ kosong |
| **TOTAL REVENUE** | ✅ (Rupiah) | ✅ (Rupiah) | ✅ dihitung |

**Aturan tampilan:**
- Header judul "TARGET MONTHLY" berwarna **oranye/amber** (`--amber` atau `--gold` sesuai palet brand) — sengaja dibedakan dari header hijau di Blok 1, supaya secara visual jelas ini adalah blok berbeda kontekstual (Summary aktivitas vs Target finansial).
- Baris "TOTAL REVENUE" diberi visual penekanan: bold, border atas tebal memisahkan dari baris-baris di atasnya (karena ini baris kalkulasi akhir/grand total, bukan item biasa).
- Format angka Revenue menggunakan separator ribuan ala Indonesia (titik), contoh: `1.995.123.013` — bukan format US dengan koma.
- Ach% Total Revenue mengikuti conditional formatting bagian 3.3.
- Sumber data:
  - Produksi OB & ORE → agregat `surat_jalan` (Rit Operation) per material, MTD.
  - Total Revenue Plan → `Target Revenue Bulanan` di Master Data → Budget & Target.
  - Total Revenue Aktual → SUM(`revenue`) dari `surat_jalan` MTD.

### 9A.3 Blok 3 — Chart "Produksi Harian"

Line chart sederhana dengan 2 garis:

| Garis | Style | Warna |
|---|---|---|
| Plan Produksi | Solid line | Hijau tua (konsisten dengan header Summary MTD) |
| Aktual Produksi | Solid line, lebih tipis/pudar | Abu muda |

**Spesifikasi chart:**
- Sumbu X: tanggal 1–31 (jumlah hari sesuai bulan terpilih), sama dengan kolom tanggal di tabel utama di bawahnya — supaya secara visual user bisa langsung korelasikan posisi tanggal antara chart dan tabel.
- Sumbu Y: total tonase produksi (gabungan OB + ORE; defaultnya gabungan total seperti referensi).
- Tidak perlu grid garis vertikal tebal per tanggal, cukup garis horizontal tipis untuk skala Y (auto-scale sesuai data tertinggi).
- Legend di kanan atas chart, bukan di bawah.
- Title chart "Produksi Harian" di kiri atas, bukan center.
- Container chart diberi border tipis biru/abu untuk memisahkan dari 2 blok tabel di sebelah kiri.
- Hover tooltip menampilkan: tanggal, nilai Plan, nilai Aktual, dan selisihnya pada titik yang di-hover.
- Jika data Aktual untuk hari tertentu = 0 (hari belum terlewati atau hari hilang data seperti temuan tanggal 11–12 sebelumnya), garis Aktual tetap digambar turun ke 0 — **jangan** di-skip/interpolate, supaya pola anomali tetap terlihat jelas secara visual di chart.

### 9A.4 Sumber Data & Catatan Implementasi

| Item | Sumber Data | Catatan |
|---|---|---|
| OB / ORE (Plan, Aktual) | Agregat `surat_jalan` per material, filter MTD | Sudah tersedia dari modul Rit Operation |
| PA / UA (Summary MTD) | Sama dengan kalkulasi PA/UA di Section A tabel utama, diagregasi MTD | Re-use formula, jangan duplikasi logic |
| Barging HGO / LGO | **Belum ada tabel sumber** | Rekomendasi versi pertama: manual input bulanan oleh Supervisor/General Admin, tanpa breakdown harian |
| Target Revenue (Plan) | Master Data → Budget & Target → Target Revenue Bulanan per Branch | Sudah ada di struktur Master Data terbaru |
| Total Revenue (Aktual) | SUM `revenue` dari `surat_jalan`, MTD | Sudah tersedia |
| Chart Produksi Harian | Sama dengan data baris "Produksi Total" di Section A (Aktual & Plan harian) | Re-use, render ulang sebagai chart bukan tabel |

### 9A.5 Posisi & Spacing

- Section 9A ditempatkan **paling atas**, di bawah filter (Branch/Bulan/Tahun) dan di atas 4 KPI card ringkas.
- Beri jarak vertikal cukup (margin-bottom ~24px) sebelum lanjut ke 4 KPI card, supaya tidak terasa padat.
- Section ini **tidak ikut ter-scroll horizontal** bersama tabel detail di bawahnya — layout flexbox row biasa, bukan bagian dari grid waterfall yang sticky.

---

## 10. Yang TIDAK Termasuk di Versi Ini (Out of Scope)

- Tidak ada input/edit langsung dari tabel ini — murni read-only report.
- Tidak ada drag-to-compare 2 bulan berdampingan.
- Tidak ada threshold conditional formatting yang dikonfigurasi per-metrik oleh user (hardcode 70%/100% dulu).
- Tidak perlu breakdown per unit di level ini (sudah ada di laporan harian terpisah).

---

## 11. Referensi Visual Asli

Dua screenshot Excel yang menjadi acuan struktur dan formula sudah didiskusikan sebelumnya dalam sesi ini:
1. Sheet "Summary Operations" — Produksi Total, DT Beroperasi, PA, UA dengan format Aktual/Plan/Ach per tanggal.
2. Sheet "Jam Kerja" — Waterfall Jam Tersedia → EWH dengan 7 breakdown kategori delay.

Gunakan pola warna, struktur baris-per-metrik, dan logika conditional formatting dari kedua referensi tersebut sebagai dasar implementasi — bukan meniru 1:1 warna Excel (kuning/orange header), tapi disesuaikan ke palet brand HAULOPS (coklat/gold/cream pastel) yang sudah didefinisikan di `css/main.css`.