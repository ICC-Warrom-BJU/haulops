# HAULOPS — Design System

Sumber kebenaran visual untuk seluruh aplikasi. Arah: **Modern SaaS bersih**, identitas
**amber/brown** pertambangan dipertahankan. Disetujui 2026-07-06 (lihat style-guide artifact).

Prinsip: kanvas hangat-netral (bias amber, bukan abu-abu) · aksen amber/gold dipakai **hemat**
(hanya aksi utama, state aktif, fokus) · brown sebagai ink · warna status (hijau/amber/merah/biru)
**terpisah** dari aksen · angka pakai *tabular figures* · spasi ritme 8px · sudut membulat halus.

---

## Token warna (light — implemented di `styles.css`)

| Token | Hex | Peran |
|-------|-----|-------|
| `--cream` (bg) | `#FAF7F2` | Latar halaman |
| `--card` (surface) | `#FFFFFF` | Kartu, tabel, modal |
| `--surface-2` | `#F6F1E9` | Toolbar, header baris, hover |
| `--text` | `#241A12` | Ink utama |
| `--muted` | `#83705C` | Teks sekunder |
| `--line` | `#EAE1D4` | Border & pemisah |
| `--line-strong` | `#DBCFBC` | Border input, garis tegas |
| `--gold` / `--amber` | `#E8C84A` / `#E8A830` | Aksen: tombol utama, tab aktif, fokus |
| `--brown-dark` | `#6B4F35` | Tautan, aksi tabel |
| `--brown-deep` | `#3E2D1E` | Teks di atas aksen (mis. tombol gold) |
| `--green` / `--green-tint` | `#2D6A3F` / `#E7F0E9` | Ready, dalam budget |
| `--warn-ink` / `--warn-tint` | `#8A5A0E` / `#FBEFD6` | Pending / menunggu |
| `--red` / `--red-tint` | `#8F2A2E` / `#F6E7E7` | Breakdown, over budget, hapus |
| `--info` / `--info-tint` | `#3F5B7A` / `#E9EEF4` | PM / info |

**Aturan kontras:** amber terlalu terang untuk teks di atas putih → hanya untuk *fill/border/aksen*,
jangan untuk teks. Heading/ink pakai `--text` (bukan `--brown-deep` — token itu di-reserve utk
background sidebar yang permanen gelap). Teks di atas gold/amber pakai `--on-accent` (fixed, tidak
ikut tema). Teks di atas surface yang permanen gelap (sidebar, login hero, active-shift hero card)
pakai `--on-dark` (fixed terang, tidak ikut tema).

## Token warna (dark — Fase 2, ✅ aktif di app)

Diaktifkan via `@media (prefers-color-scheme: dark)` **dan** `:root[data-theme]` (toggle manual
di topbar, ikon matahari/bulan, tersimpan di `localStorage('haulops-theme')`, dibaca lebih dulu
oleh inline script di `index.html` sebelum React mount agar tidak ada kedipan tema salah).

| Token | Hex (dark) |
|---|---|
| `--cream` / `--card` / `--surface-2` | `#17110B` / `#201812` / `#2A2018` |
| `--text` / `--muted` | `#F4ECE0` / `#B6A491` |
| `--line` / `--line-strong` | `#362B20` / `#47382A` |
| `--amber` / `--on-accent` | `#EEB544` / `#2A1E12` |
| `--green` / `--red` / `--info` / `--warn-ink` | `#6BBB86` / `#E68A8E` / `#93B3D8` / `#EBB65E` |

**Token yang sengaja tetap fixed di kedua tema** (dan alasannya):
- `--brown-deep` — background sidebar (permanen gelap seperti poster brand).
- `--on-accent`, `--on-dark` — ink di atas permukaan yang sendiri tidak berubah terang/gelapnya
  (accent gold/amber, atau surface yang sengaja permanen gelap: sidebar/login-hero/active-shift).
- Gradient dekoratif `--brown-dark`/`--brown-mid`/`--brown-light` (avatar, delay-bar fill,
  active-shift hero) — warna "material" hangat, bukan ink yang perlu kontras teks.

**Audit yang dilakukan sebelum aktivasi** (agar tak ada komponen "pecah" saat tema gelap dinyalakan):
setiap `background: white`/`color: white`/hex literal di `styles.css` ditelusuri satu per satu dan
diklasifikasi jadi (a) surface biasa → ganti ke token (`--card`, dst, otomatis ikut tema), atau
(b) surface/ink yang sengaja permanen → didokumentasikan & dibiarkan. Chevron `<select>` dan tint
emas dropdown juga ditokenkan (`--chevron-svg`, `color-mix(var(--gold), var(--card))`) supaya ikut tema
tanpa duplikasi SVG per komponen.

---

## Tipografi

- **UI/heading/body:** system sans (`--font-family`, ada fallback Inter). Produksi: muat **Inter** lokal.
- **Data/angka:** `--font-mono` (`ui-monospace, "SF Mono", Consolas, monospace`) + `font-variant-numeric: tabular-nums`
  untuk kolom angka, kode unit, Rp, jam, km. Cegah pergeseran layout.
- Skala: 11/12/13/14/16/18/22/28/36 (`--font-size-*`). Bobot: 400 body · 500 label · 600 heading · 700–800 display.
- Heading pakai `letter-spacing: -0.01em` dan `text-wrap: balance`. Label uppercase `letter-spacing: .05–.08em`.

## Spasi, bentuk, kedalaman

- Ritme **4/8px**: 4 8 12 16 24 32 48.
- Radius: `--r-sm 6` · `--r-md 10` · `--r-lg 14` · `--r-pill 999`.
- Bayangan berlapis lembut: `--sh-sm` (kartu) · `--sh-md` (hover/menonjol) · `--sh-lg` (modal). `--shadow` = alias `--sh-sm`.

---

## Aturan komponen

- **Tombol.** Primary = gradient gold→amber, teks `--brown-deep`, `--sh-sm` (hover naik ke `--sh-md`).
  Secondary = surface + border `--line-strong` (hover border amber). Ghost = transparan, teks brown.
  Danger = teks/border merah, hover `--red-tint`. Radius `--r-md`. Aktif `translateY(1px)`. Disabled opacity .45.
  Selalu ada **satu** primary per layar/modal.
- **Input & Select.** Border `--line-strong` 1.5px, radius 9px; fokus border amber + ring
  `0 0 0 3px amber/22%`. **Select** ditandai: tint gold 12% + `border-left: 3px amber` + chevron SVG
  (penanda bukan-hanya-warna). Label uppercase kecil. Error: border merah + pesan merah di bawah field.
- **Tab.** Underline: `--muted` → aktif teks `--text` + `border-bottom: 2px amber`.
- **Badge status.** Pill + titik warna. Ready=green · Pending=warn · Breakdown/Over=red · PM=info.
  Selalu ada teks (bukan warna saja).
- **Kartu.** Border `--line`, radius `--r-lg`, `--sh-sm`. `.card-header` = flex space-between, border-bottom.
- **KPI tile.** Label uppercase kecil · nilai besar tabular · delta (hijau naik / merah turun) · sparkline opsional.
- **Tabel.** Header uppercase kecil di `--surface-2`; baris border-bottom `--line`; hover `--surface-2`.
  Kolom angka rata kanan + mono tabular. Aksi baris: tombol teks (Lihat/Edit/Hapus, Hapus merah).
- **Modal.** Overlay scrim gelap 45–55%; panel `--sh-lg`; header + body grid + footer (Batal + primary).

---

## Rollout

1. ✅ Style-guide disetujui · `DESIGN.md` (ini).
2. ✅ **Fondasi `styles.css`** — retrofit nilai token + tambah token baru (radii, shadow, tint, mono).
3. ✅ **Refine komponen global** — tombol, tombol aksi baris (`.rowact`, seragam & sejajar), input/select,
   tab, tabel, kartu, badge, KPI, modal.
4. ✅ **Per-layar (mayoritas via komponen global)** — Master Data & Modul Operasi ikut otomatis.
5. ✅ **Fase 2 — Dark mode**: audit warna hardcoded (semua `background/color: white`/hex literal
   diklasifikasi & ditokenkan), token dark diaktifkan via `@media (prefers-color-scheme: dark)` +
   `[data-theme]`, toggle manual di topbar (persist `localStorage`, no-flash via `index.html`).
