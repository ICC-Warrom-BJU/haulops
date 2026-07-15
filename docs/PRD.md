# Product Requirements Document (PRD)

## Hauling Operations Monitoring System — HAULOPS v2.0

| Dokumen | Detail |
|---------|--------|
| **Versi** | 2.1 |
| **Status** | Draft — Fase Perencanaan (disesuaikan dengan prototype frontend) |
| **Tech Stack** | Node.js + Express + Prisma + PostgreSQL + React + TypeScript + TailwindCSS |
| **Arsitektur** | Monorepo (turborepo/pnpm workspaces) — REST API + SPA |
| **Target Rilis MVP** | 14–19 minggu |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [API Design (REST)](#4-api-design-rest)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Modul & Spesifikasi Fungsional](#6-modul--spesifikasi-fungsional)
7. [Rencana Implementasi per Fase](#7-rencana-implementasi-per-fase)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Deployment Strategy](#9-deployment-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Glossary](#11-glossary)

---

## 1. Ringkasan Eksekutif

### 1.1 Visi
Sistem informasi terpadu untuk monitoring, pencatatan, dan analisis operasional hauling tambang mineral nikel secara real-time.

### 1.2 Tujuan

| Tujuan | Metrik Keberhasilan |
|--------|---------------------|
| Digitalisasi pencatatan produksi hauling | 100% data ritase tercatat digital |
| Monitoring delay & breakdown real-time | Delay over budget terdeteksi < 1 jam |
| Audit trail approval | Setiap approval memiliki timestamp & user ID |
| Laporan otomatis | Report siap dalam < 5 detik |
| Budget control | Actual vs budget terlihat di setiap modul |

### 1.3 Ruang Lingkup

**In Scope:**
- Backend REST API (Express.js + Prisma + PostgreSQL)
- Frontend SPA (React + Vite + TypeScript + TailwindCSS)
- 13 modul fungsional (lihat bagian 6)
- Autentikasi JWT + Role-based access control
- Export laporan (CSV)
- Responsive web (desktop-first, tablet support)

**Out of Scope (Fase 2):**
- Mobile native apps
- IoT/ GPS integration
- Machine learning / predictive maintenance
- Face recognition / biometric
- Automated vendor API integration

### 1.4 Persiapan Implementasi yang Disarankan Sebelum Coding
Sebelum membangun sistem, tim perlu menyiapkan hal-hal berikut agar implementasi sesuai dengan logika bisnis dan prototype frontend yang sudah ada:

1. Persiapan data master awal
- Siapkan data branch, unit DT, tipe unit, operator, material, pit, stockpile, delay type, status operation, dan budget target.
- Tentukan skema operasional per branch: WITH_TIMBANGAN atau WITHOUT_TIMBANGAN.
- Definisikan default shift dan jam operasional (pagi, malam, steady day).

2. Persiapan aturan bisnis utama
- Shift hanya bisa dibuka jika branch dan tanggal valid.
- Unit dapat diassign ke shift dan dipakai di Rit, Delay, BBM, dan Maintenance.
- Delay fleet-wide harus bisa menimpa banyak unit sekaligus, sedangkan delay per unit hanya untuk satu unit.
- Maintenance hanya boleh satu record per unit per shift.
- Approval shift harus dilakukan oleh supervisor setelah shift ditutup.
- Edit request wajib mencatat nilai lama, nilai baru, alasan, dan reviewer.

3. Persiapan arsitektur dan environment
- Monorepo backend + frontend.
- Database PostgreSQL + Prisma migrations.
- Auth JWT, role-based access, middleware validation.
- Folder structure frontend sesuai modul: dashboard, shift, rit-operation, delay, maintenance, bbm, approval, laporan, master, settings.
- CI/CD dan environment variable untuk development/production.

4. Persiapan UX dan workflow UI
- Semua halaman wajib memiliki layout konsisten: sidebar, topbar, page header, toolbar/filter, card/table, modal.
- Tombol utama seperti Add, Edit, Generate, Export, Filter, Save, Approve, Reject, dan Close harus tersedia di halaman yang relevan.
- Notifikasi toast, modal konfirmasi, dan badge status wajib digunakan sesuai contoh.

5. Prioritas implementasi yang disarankan
- Fase 0: setup project, auth, master data, shared UI.
- Fase 1: shift management, rit operation, delay, maintenance, BBM.
- Fase 2: approval, dashboard, laporan, settings.
- Fase 3: polishing, export, audit trail, performance tuning.

---

## 2. Arsitektur Sistem

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                   │
│  React SPA ─── Vite ─── TypeScript ─── TailwindCSS                 │
│       │                                                            │
│       │  TanStack Query (data fetching & cache)                    │
│       │  Zustand (global state: auth, branch, sidebar)             │
│       │  React Router (routing)                                    │
│       │  React Hook Form + Zod (form validation)                   │
│       │  Tremor / Recharts (charts)                                │
│       │                                                             │
│       ├──── axios ──── HTTP ────┐                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────┐
│                     API LAYER   │                                   │
│                                  │                                   │
│  Express.js ─── TypeScript ─── Zod (validation)                     │
│       │                                                            │
│       ├── Auth Middleware (JWT)                                     │
│       ├── Role Middleware (Admin Mining / Supervisor / General Admin)│
│       ├── Validation Middleware (Zod schemas)                       │
│       ├── Error Handler Middleware                                   │
│       │                                                             │
│       └──── Prisma ORM ────┐                                        │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────┐
│                    DATA LAYER│                                       │
│                              │                                       │
│  PostgreSQL ─── PgAdmin (opsional)                                   │
│  Redis (session cache, optional)                                     │
│  MinIO / S3 (file upload: Excel import, foto)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack Detail

#### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Type safety |
| Express.js | 4.x | HTTP framework |
| Prisma | 6.x | ORM + migrations |
| PostgreSQL | 16 | Database |
| Zod | 3.x | Request validation |
| JWT (jsonwebtoken) | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| Swagger (swagger-jsdoc) | 7.x | API docs |
| Pino / Morgan | - | Logging |
| Multer | 1.x | File upload |
| date-fns | 3.x | Date utilities |
| ExcelJS | 4.x | Excel export/import |

#### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| TailwindCSS | 4.x | Styling |
| React Router | 7.x | Routing |
| TanStack Query | 5.x | Server state |
| Zustand | 5.x | Client state |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Form validation |
| Tremor | 3.x | Dashboard components |
| Recharts | 2.x | Charts |
| axios | 1.x | HTTP client |
| date-fns | 3.x | Date formatting |
| react-hot-toast | 2.x | Notifications |

#### Infrastruktur

| Teknologi | Fungsi |
|-----------|--------|
| Docker + docker-compose | Containerization |
| Nginx | Reverse proxy |
| GitHub Actions | CI/CD |
| DigitalOcean / VPS | Hosting |
| Cloudflare | DNS + CDN |

### 2.3 Monorepo Structure

```
hauloops/
├── package.json                    # Root package.json (pnpm workspace)
├── turbo.json                      # Turborepo config
├── docker-compose.yml              # PostgreSQL + app
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + test
│       └── deploy.yml              # Deploy to VPS
├── packages/
│   ├── server/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── seed.ts             # Seed data
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── config/
│   │   │   │   ├── env.ts          # Environment variables (Zod)
│   │   │   │   └── database.ts     # Prisma client singleton
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # JWT verification
│   │   │   │   ├── role.ts         # Role-based access
│   │   │   │   ├── validate.ts     # Zod validation
│   │   │   │   └── error.ts        # Global error handler
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.schema.ts  # Zod schemas
│   │   │   │   ├── shift/
│   │   │   │   ├── rit/
│   │   │   │   ├── delay/
│   │   │   │   ├── bbm/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── approval/
│   │   │   │   ├── laporan/
│   │   │   │   ├── master/
│   │   │   │   └── settings/
│   │   │   ├── utils/
│   │   │   │   ├── pagination.ts
│   │   │   │   ├── date.ts
│   │   │   │   └── number.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes/
│       │   │   └── index.tsx       # Route definitions
│       │   ├── layouts/
│       │   │   ├── AuthLayout.tsx
│       │   │   └── MainLayout.tsx
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── shift/
│       │   │   ├── rit/
│       │   │   ├── delay/
│       │   │   ├── bbm/
│       │   │   ├── maintenance/
│       │   │   ├── approval/
│       │   │   ├── laporan/
│       │   │   ├── master/
│       │   │   └── settings/
│       │   ├── components/
│       │   │   ├── ui/             # Reusable UI (Button, Card, Modal, Table, Badge, Tabs)
│       │   │   ├── layout/         # Sidebar, Topbar, BranchSelector
│       │   │   └── shared/         # KpiCard, StatusBadge, FilterBar, Pagination
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useBranch.ts
│       │   │   ├── usePagination.ts
│       │   │   └── useDebounce.ts
│       │   ├── services/
│       │   │   ├── api.ts          # Axios instance
│       │   │   ├── auth.api.ts
│       │   │   ├── shift.api.ts
│       │   │   └── ...
│       │   ├── stores/
│       │   │   ├── authStore.ts
│       │   │   ├── branchStore.ts
│       │   │   └── uiStore.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── utils/
│       │       ├── cn.ts           # clsx + tailwind-merge
│       │       ├── formatters.ts
│       │       └── validators.ts
│       ├── tsconfig.json
       ├── package.json
       ├── vite.config.ts
       ├── tailwind.config.ts
       └── index.html
```

### 2.4 Environment Variables

```env
# Server
DATABASE_URL="postgresql://user:pass@localhost:5432/hauloops?schema=public"
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="8h"
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL="http://localhost:3001/api/v1"
```

---

## 3. Database Schema (Prisma)

### 3.1 Entity Relationship Diagram (Textual)

```
Branch ───┬── Unit
          ├── Shift
          ├── Operator
          └── Rate

Unit ───┬── ShiftUnit
        ├── Rit
        ├── Delay
        ├── Maintenance
        ├── BBMLog
        └── ActualStatus

TipeUnit ───┬── Unit
            ├── Rate
            ├── BudgetMaterialTarget
            └── NettoEstimasi

Shift ───┬── ShiftUnit
         ├── Rit
         └── Approval

User ───┬── Approval
        ├── BBMLog (operator)
        └── Shift (closedBy)
```

### 3.2 Complete Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ======================== REFERENCE / MASTER DATA ========================

model Branch {
  id        String   @id @default(uuid())
  kode      String   @unique // CLM-LR, NPM-KON, PPS-ST
  nama      String   // Project CLM Luwu Raya
  skemaTimbangan String @default("WITH_TIMBANGAN") // WITH_TIMBANGAN | WITHOUT_TIMBANGAN
  aktif     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  units      Unit[]
  operators  Operator[]
  shifts     Shift[]
  rates      Rate[]
  netto      NettoEstimasi[]
  targetProd TargetProduksi[]
  targetRev  TargetRevenue[]
}

model TipeUnit {
  id            String   @id @default(uuid())
  kode          String   @unique // DT-KECIL, DT-BESAR
  nama          String   // DT Kecil, DT Besar
  kapasitasTon  Float    // 20, 40
  budgetBreakdownJam Float // 3 jam/hari
  budgetLton    Float?   // 0.30 (deprecated, retained for reference)
  budgetLjam    Float?   // 20.0
  budgetKmL     Float?   // 3.0
  targetRevenue Float?   // per unit per bulan
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  units              Unit[]
  rates              Rate[]
  netto              NettoEstimasi[]
  budgetMaterialTargets BudgetMaterialTarget[]
}

model Unit {
  id         String   @id @default(uuid())
  kode       String   @unique // DT-001
  polisi     String?  // KT 1234 AB
  noRangka   String?
  noMesin    String?
  tahun      Int?
  kapasitas  Float    // 20 ton

  tipeId     String
  tipe       TipeUnit @relation(fields: [tipeId], references: [id])

  branchId   String
  branch     Branch   @relation(fields: [branchId], references: [id])

  budgetBreakdownJam Float @default(3) // override per unit
  aktif      Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  shiftUnits     ShiftUnit[]
  rits           Rit[]
  delays         Delay[]
  maintenances   Maintenance[]
  bbmLogs        BBMLog[]
  actualStatuses ActualStatus[]
}

model Operator {
  id            String   @id @default(uuid())
  nama          String
  nik           String   @unique
  telepon       String?
  sim           String?
  tglLahir      DateTime?
  tglBergabung  DateTime?
  kontakDarurat String?
  branchId      String
  branch        Branch   @relation(fields: [branchId], references: [id])
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  shiftUnits ShiftUnit[]
  rits       Rit[]
}

model Material {
  id          String   @id @default(uuid())
  nama        String   @unique // Nikel OB, Nikel ORE
  kode        String   @unique
  kategori    String?  // Overburden, Ore
  satuan      String   @default("ton")
  targetProduksiBulanan Float?
  aktif       Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rates            Rate[]
  netto            NettoEstimasi[]
  budgetTargets    BudgetMaterialTarget[]
  targetProduksis  TargetProduksi[]
}

model LokasiPit {
  id             String   @id @default(uuid())
  nama           String   // Pit A1
  kodeArea       String?
  materialDominan String?
  jarakKeROM     Float?
  aktif          Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  rits Rit[]
}

model LokasiStockpile {
  id           String   @id @default(uuid())
  nama         String   // ROM 1, Disposal A
  kode         String?
  kapasitasTon Float?
  aktif        Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  rits Rit[]
}

model Rate {
  id         String   @id @default(uuid())
  branchId   String
  branch     Branch   @relation(fields: [branchId], references: [id])
  tipeUnitId String
  tipeUnit   TipeUnit @relation(fields: [tipeUnitId], references: [id])
  materialId String
  material   Material @relation(fields: [materialId], references: [id])
  pitId      String?
  stockpileId String?
  rateRpPerTon Float
  berlakuDari DateTime
  berlakuSampai DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([branchId, tipeUnitId, materialId])
}

model NettoEstimasi {
  id              String   @id @default(uuid())
  branchId        String
  branch          Branch   @relation(fields: [branchId], references: [id])
  tipeUnitId      String
  tipeUnit        TipeUnit @relation(fields: [tipeUnitId], references: [id])
  materialId      String
  material        Material @relation(fields: [materialId], references: [id])
  nettoEstimasiTon Float
  faktorMuatan    Float    // 0-100%
  berlakuDari     DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([branchId, tipeUnitId, materialId])
}

model DelayType {
  id        String   @id @default(uuid())
  kode      String   @unique // RAIN, PIT_OPEN, TIRE, FUELING
  nama      String   // Hujan, Buka Tutup Pit
  kategori  String   // Cuaca, Operasional, Mekanik, Administrasi
  scope     String   // FLEET | UNIT
  budgetMenit Int?
  kenaPA    Boolean  @default(true) // apakah delay ini mengurangi PA
  aktif     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  delays Delay[]
}

model StatusOperation {
  id        String   @id @default(uuid())
  kode      String   @unique // W, R, P, F, D, U, C, M
  nama      String   // Working, Ready, etc
  group     String   // Available, Breakdown, etc
  warna     String   // hex color
  isPA      Boolean  @default(false)
  isUA      Boolean  @default(false)
  isProd    Boolean  @default(false)
  urutan    Int      @default(0)
  createdAt DateTime @default(now())

  actualStatuses ActualStatus[]
}

// ======================== TRANSACTIONAL ========================

model Shift {
  id            String    @id @default(uuid())
  tanggal       DateTime  // tanggal shift
  tipe          String    // pagi, siang, malam, steady_day
  jamMulai      String    // 06:00
  jamSelesai    String    // 14:00
  branchId      String
  branch        Branch    @relation(fields: [branchId], references: [id])
  catatan       String?
  status        String    @default("open") // open | pending | approved | rejected
  closedAt      DateTime?
  closedById    String?   // User who closed
  closedBy      User?     @relation(fields: [closedById], references: [id], onDelete: NoAction)
  approvedAt    DateTime?
  approvedById  String?
  approvedBy    User?     @relation(fields: [approvedById], references: [id], onDelete: NoAction)
  rejectReason  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  shiftUnits ShiftUnit[]
  rits       Rit[]
  approvals  Approval[]
}

model ShiftUnit {
  id         String    @id @default(uuid())
  shiftId    String
  shift      Shift     @relation(fields: [shiftId], references: [id])
  unitId     String
  unit       Unit      @relation(fields: [unitId], references: [id])
  operatorId String?
  operator   Operator? @relation(fields: [operatorId], references: [id], onDelete: NoAction)
  material   String?   // material assigned for this shift
  statusAwal String?   // Standby, Ready, Breakdown
  createdAt  DateTime  @default(now())

  @@unique([shiftId, unitId])
}

model Rit {
  id              String    @id @default(uuid())
  noRit           String    @unique // RIT-{BRANCH}-{YYYYMMDD}-{SEQ}

  shiftId         String
  shift           Shift     @relation(fields: [shiftId], references: [id])

  unitId          String
  unit            Unit      @relation(fields: [unitId], references: [id])

  operatorId      String?
  operator        Operator? @relation(fields: [operatorId], references: [id], onDelete: NoAction)

  pitId           String?
  pit             LokasiPit? @relation(fields: [pitId], references: [id], onDelete: NoAction)
  stockpileId     String?
  stockpile       LokasiStockpile? @relation(fields: [stockpileId], references: [id], onDelete: NoAction)
  material        String    // Nikel OB, Nikel ORE

  jumlahRit       Int       // total trip
  jarakKm         Float?    // total jarak tempuh

  // Timbangan
  grossKg         Float?
  tareKg          Float?
  nettoTon        Float?
  statusTimbangan String    @default("manual") // manual | pending | imported | mismatch | estimasi

  // Estimasi (jika WITHOUT_TIMBANGAN)
  estimasiTon     Float?

  catatan         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([shiftId, unitId])
  @@index([tanggal]) // derived from shift.tanggal
}

model Delay {
  id          String    @id @default(uuid())
  shiftId     String
  shift       Shift     @relation(fields: [shiftId], references: [id])
  delayTypeId String
  delayType   DelayType @relation(fields: [delayTypeId], references: [id])
  scope       String    // FLEET | UNIT
  unitId      String?   // null if FLEET
  unit        Unit?     @relation(fields: [unitId], references: [id], onDelete: NoAction)
  jamMulai    DateTime
  jamSelesai  DateTime?
  durasiMenit Int
  keterangan  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([shiftId, unitId])
}

model Maintenance {
  id          String    @id @default(uuid())
  shiftId     String
  shift       Shift     @relation(fields: [shiftId], references: [id])
  unitId      String
  unit        Unit      @relation(fields: [unitId], references: [id])
  jenis       String    // Breakdown | PM | Full Day BD | Ready | Standby
  jamMulai    DateTime
  jamSelesai  DateTime?
  durasiJam   Float     @default(0)
  budgetJam   Float     @default(3)
  keterangan  String?
  partDiganti String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([shiftId, unitId]) // 1 unit 1 record per shift
}

model BBMLog {
  id           String    @id @default(uuid())
  shiftId      String
  shift        Shift     @relation(fields: [shiftId], references: [id])
  unitId       String
  unit         Unit      @relation(fields: [unitId], references: [id])
  operatorBbmId String
  operatorBbm  User      @relation(fields: [operatorBbmId], references: [id])
  jamPengisian DateTime
  lokasi       String?   // Pool, Pit Station, Mobile Truck
  liter        Float
  odometer     Float?
  hourMeter    Float?
  keterangan   String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([shiftId, unitId])
}

model ActualStatus {
  id        String    @id @default(uuid())
  unitId    String
  unit      Unit      @relation(fields: [unitId], references: [id])
  tanggal   DateTime
  statusOpId String
  statusOp  StatusOperation @relation(fields: [statusOpId], references: [id])
  catatan   String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([unitId, tanggal])
}

// ======================== APPROVAL & AUDIT ========================

model Approval {
  id          String    @id @default(uuid())
  shiftId     String
  shift       Shift     @relation(fields: [shiftId], references: [id])
  tipe        String    // shift_approval | edit_request
  aksi        String    // approved | rejected
  catatan     String?
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
}

model EditRequest {
  id          String    @id @default(uuid())
  tipe        String    // rit | delay | bbm | maintenance
  recordId    String    // ID of the record being edited
  field       String    // field name
  nilaiLama   String
  nilaiBaru   String
  alasan      String
  dibuatById  String
  dibuatBy    User      @relation(fields: [dibuatById], references: [id])
  status      String    @default("pending") // pending | approved | rejected
  reviewedById String?
  reviewedBy  User?     @relation(fields: [reviewedById], references: [id], onDelete: NoAction)
  catatanReview String?
  createdAt   DateTime  @default(now())
  reviewedAt  DateTime?
}

// ======================== BUDGET & TARGET ========================

model BudgetMaterialTarget {
  id          String    @id @default(uuid())
  tipeUnitId  String
  tipeUnit    TipeUnit  @relation(fields: [tipeUnitId], references: [id])
  materialId  String
  material    Material  @relation(fields: [materialId], references: [id])
  bulan       Int       // 1-12
  tahun       Int
  targetRitase Int?
  targetTonase Float
  targetEWH   Float?    // target effective working hours
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tipeUnitId, materialId, bulan, tahun])
}

model TargetProduksi {
  id         String    @id @default(uuid())
  branchId   String
  branch     Branch    @relation(fields: [branchId], references: [id])
  materialId String
  material   Material  @relation(fields: [materialId], references: [id])
  bulan      Int
  tahun      Int
  targetTon  Float
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([branchId, materialId, bulan, tahun])
}

model TargetRevenue {
  id          String    @id @default(uuid())
  branchId    String
  branch      Branch    @relation(fields: [branchId], references: [id])
  bulan       Int
  tahun       Int
  targetRp    Float
  keterangan  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([branchId, bulan, tahun])
}

// ======================== USER & AUTH ========================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String    // bcrypt hash
  nama          String
  role          String    // admin_mining | supervisor | general_admin | super_admin
  branchId      String?
  branch        Branch?   @relation(fields: [branchId], references: [id], onDelete: NoAction)
  avatarUrl     String?
  aktif         Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relasi
  shiftsClosed    Shift[]       @relation("closedBy")
  shiftsApproved  Shift[]       @relation("approvedBy")
  bbmLogs         BBMLog[]      @relation("operatorBbm")
  approvals       Approval[]
  editRequests    EditRequest[] @relation("dibuatBy")
  editReviewed    EditRequest[] @relation("reviewedBy")
}

// ======================== COMPUTED VIEWS (untuk laporan) ========================

// Laporan harian akan menggunakan query agregasi, bukan table terpisah.
// Contoh query untuk Daily Report:
//
// SELECT
//   u.kode as unit,
//   u.tipe,
//   COUNT(r.id) as total_rit,
//   COALESCE(SUM(r.nettoTon), 0) as total_tonase,
//   ... (PA, UA, EWH dihitung dari delay & maintenance)
// FROM "Unit" u
// LEFT JOIN "Rit" r ON r.unitId = u.id AND r.shiftId = :shiftId
// WHERE u.branchId = :branchId
// GROUP BY u.id
```

### 3.3 Key Relationships Summary

```
Shift 1──N ShiftUnit N──1 Unit
                    N──1 Operator

Shift 1──N Rit N──1 Unit
               N──1 Operator
               N──1 LokasiPit
               N──1 LokasiStockpile

Shift 1──N Delay N──1 DelayType
                N──? Unit

Shift 1──N Maintenance N──1 Unit

Shift 1──N BBMLog N──1 Unit
                 N──1 User (operatorBbm)

Shift 1──N Approval N──1 User

TipeUnit 1──N BudgetMaterialTarget N──1 Material

Unit 1──N ActualStatus N──1 StatusOperation
```

---

## 4. API Design (REST)

### 4.1 API Conventions

| Atribut | Standar |
|---------|---------|
| Base URL | `/api/v1` |
| Format Request/Response | JSON |
| Pagination | `?page=1&limit=25` → `{ data: [...], meta: { page, limit, total, totalPages } }` |
| Sorting | `?sortBy=kode&sortOrder=asc` |
| Filtering | `?branchId=xxx&tipe=pagi` |
| Date Format | ISO 8601 (`2026-06-07T06:00:00Z`) |
| Error Response | `{ success: false, message: "...", errors?: [...] }` |
| Success Response | `{ success: true, data: {...}, meta?: {...} }` |

### 4.2 Authentication

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/v1/auth/login` | No | Login → return JWT |
| POST | `/api/v1/auth/register` | No | Register user pertama |
| GET | `/api/v1/auth/me` | Yes | Profile user saat ini |
| PUT | `/api/v1/auth/password` | Yes | Ganti password |

### 4.3 Master Data Endpoints

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/v1/master/units` | Yes | All |
| POST | `/api/v1/master/units` | Yes | GA, Super Admin |
| PUT | `/api/v1/master/units/:id` | Yes | GA, Super Admin |
| GET | `/api/v1/master/tipe-unit` | Yes | All |
| POST | `/api/v1/master/tipe-unit` | Yes | GA, Super Admin |
| PUT | `/api/v1/master/tipe-unit/:id` | Yes | GA, Super Admin |
| GET | `/api/v1/master/operators` | Yes | All |
| POST | `/api/v1/master/operators` | Yes | GA, Super Admin |
| GET | `/api/v1/master/pits` | Yes | All |
| GET | `/api/v1/master/stockpiles` | Yes | All |
| GET | `/api/v1/master/materials` | Yes | All |
| GET | `/api/v1/master/delay-types` | Yes | All |
| POST | `/api/v1/master/delay-types` | Yes | GA, Super Admin |
| GET | `/api/v1/master/status-operations` | Yes | All |
| GET | `/api/v1/master/rates` | Yes | All |
| POST | `/api/v1/master/rates` | Yes | GA, Super Admin |
| GET | `/api/v1/master/netto-estimasi` | Yes | All |
| GET | `/api/v1/master/budget-material-targets` | Yes | All |
| POST | `/api/v1/master/budget-material-targets` | Yes | GA, Super Admin |
| GET | `/api/v1/master/branches` | Yes | All |

### 4.4 Shift Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/shifts` | List shifts (filter branch, tipe, status, date range) |
| GET | `/api/v1/shifts/:id` | Detail shift + units + KPI |
| POST | `/api/v1/shifts` | Buka shift baru |
| POST | `/api/v1/shifts/:id/close` | Tutup shift + validasi UA% |
| POST | `/api/v1/shifts/:id/approve` | Approve shift |
| POST | `/api/v1/shifts/:id/reject` | Reject shift |
| GET | `/api/v1/shifts/:id/units` | Units dalam shift |

### 4.5 Rit Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/rits` | List rit (filter shift, unit, material, date) |
| GET | `/api/v1/rits/:id` | Detail rit |
| POST | `/api/v1/rits` | Input rit baru |
| PUT | `/api/v1/rits/:id` | Update rit (jika belum approved) |
| POST | `/api/v1/rits/:id/edit-request` | Kirim edit request (jika sudah approved) |
| POST | `/api/v1/rits/import` | Import dari Excel vendor timbangan |
| GET | `/api/v1/rits/grouped` | Rits grouped by tanggal + unit (untuk visual grouping) |

### 4.6 Delay Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/delays` | List delays |
| POST | `/api/v1/delays` | Input delay (support fleet-wide: kirim array unitIds) |
| PUT | `/api/v1/delays/:id` | Update delay |
| GET | `/api/v1/delays/summary` | Budget vs realtime summary |
| GET | `/api/v1/delays/validation/:unitId/:tanggal` | Cek total delay unit per hari |

### 4.7 Maintenance Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/maintenance` | List maintenance |
| POST | `/api/v1/maintenance` | Input maintenance |
| PUT | `/api/v1/maintenance/:id` | Update |
| GET | `/api/v1/maintenance/issues` | List issue (Breakdown/PM/Full Day BD) |
| GET | `/api/v1/maintenance/ready` | List unit Ready |

### 4.8 BBM Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/bbm` | List BBM logs |
| POST | `/api/v1/bbm` | Input BBM |
| GET | `/api/v1/bbm/previous/:unitId` | Get previous Odo/HM for auto-fetch |
| GET | `/api/v1/bbm/report` | BBM report aggregated |

### 4.9 Approval Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/approvals` | List approvals (history) |
| GET | `/api/v1/approvals/pending-shifts` | Shifts pending approval |
| POST | `/api/v1/approvals/bulk-approve-shifts` | Bulk approve shifts |
| POST | `/api/v1/approvals/bulk-reject-shifts` | Bulk reject shifts |
| GET | `/api/v1/approvals/edit-requests` | List pending edit requests |
| POST | `/api/v1/approvals/edit-requests/:id/approve` | Approve edit request |
| POST | `/api/v1/approvals/edit-requests/:id/reject` | Reject edit request |

### 4.10 Laporan Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/laporan/daily` | Daily report per unit (Ritase, Tonase, PA, UA, EWH, Cycle Time, BBM, Revenue) |
| GET | `/api/v1/laporan/delay-summary` | Delay summary vs budget |
| GET | `/api/v1/laporan/bbm` | BBM report (Jam/L) |
| GET | `/api/v1/laporan/maintenance` | Maintenance report |
| GET | `/api/v1/laporan/bulanan` | Monthly recap + trend data |
| GET | `/api/v1/laporan/export` | Export to Excel |

### 4.11 Dashboard Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/dashboard/kpi` | KPI cards (current shift/branch) |
| GET | `/api/v1/dashboard/chart-tonase` | Tonnage chart data (7 days) |
| GET | `/api/v1/dashboard/delay-vs-budget` | Delay vs budget chart |
| GET | `/api/v1/dashboard/fleet-status` | Fleet status grid |
| GET | `/api/v1/dashboard/alerts` | Alert list |
| GET | `/api/v1/dashboard/recent-rits` | Recent rit records |

### 4.12 Actual Operation Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/actual-operation` | Status matrix per unit per date range |
| PUT | `/api/v1/actual-operation/:unitId/:tanggal` | Update status for a cell |
| GET | `/api/v1/actual-operation/export` | Export CSV |

---

## 5. Frontend Architecture

### 5.1 Route Structure

```
/login                          → LoginPage
/                               → DashboardPage (protected)
/actual-operation               → ActualOpPage
/shift                          → ShiftPage
/shift/:id                      → ShiftDetailPage
/rit                            → RitOperationPage
/delay                          → DelayPage
/maintenance                    → MaintenancePage
/bbm                            → BBMPage
/cycle-time                     → CycleTimePage
/approval                       → ApprovalPage
/laporan                        → LaporanPage
/master                          → MasterDataPage
/settings                       → SettingsPage
```

### 5.2 Component Tree (Core UI)

```
<App>
  <AuthProvider>
    <BranchProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<MainLayout />}>  {/* Protected */}
            <Route index element={<DashboardPage />} />
            <Route path="shift/*" element={<ShiftPage />} />
            <Route path="rit" element={<RitOperationPage />} />
            ...
          </Route>
        </Routes>
      </Router>
    </BranchProvider>
  </AuthProvider>
</App>

<MainLayout>
  <Sidebar>
    <SidebarBrand logo={haulops} subtitle="Smart Mining BJU Platform" />
    <SidebarNavGroup title="Operasional" items={[...]} />
    <SidebarNavGroup title="Monitoring" items={[...]} />
    <SidebarNavGroup title="Administrasi" items={[...]} />
    <SidebarBranchSelector />
    <SidebarUserFooter />
  </Sidebar>
  <div className="main-wrapper">
    <Topbar title={pageTitle} />
    <main className="page-content">{children}</main>
  </div>
</MainLayout>
```

### 5.3 State Management Strategy

| State | Tool | Scope |
|-------|------|-------|
| Auth (user, token, role) | Zustand | Global |
| Branch aktif | Zustand | Global |
| UI state (sidebar open, modal) | Zustand | Global |
| Server data (shifts, rits, etc) | TanStack Query | Per page |
| Form state | React Hook Form | Local |
| Theme / preferences | Zustand + persist | Global |

### 5.4 Shared UI Components

```
components/ui/
├── Button.tsx           # variants: primary, gold, outline, ghost, danger, success
├── Card.tsx             # + CardHeader, CardBody
├── Modal.tsx            # sizes: sm, md, lg; overlay, header, body, footer
├── Table.tsx            # sortable, paginated, selectable rows
├── Badge.tsx            # variants for all statuses
├── Tabs.tsx             # controlled tab panel
├── Input.tsx            # with label, error, hint
├── Select.tsx           # with label, searchable option
├── DatePicker.tsx       # date range picker
├── Pagination.tsx       # page controls
├── Toast.tsx            # notification toasts
├── ProgressBar.tsx      # colored fill bar
├── KpiCard.tsx          # stat display card
├── FilterBar.tsx        # filter controls group
├── ConfirmDialog.tsx    # confirmation modal
└── EmptyState.tsx       # empty data placeholder
```

### 5.5 Custom Hooks

```
hooks/
├── useAuth.ts           # login, logout, me, token management
├── useBranch.ts         # active branch, switch branch
├── usePagination.ts     # page/limit state + handlers
├── useDebounce.ts       # debounced value
├── useLocalStorage.ts   # typed localStorage wrapper
└── useMediaQuery.ts     # responsive breakpoint detection
```

### 5.6 API Service Layer

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// services/shift.api.ts
export const shiftApi = {
  list: (params: ShiftFilterParams) => api.get('/shifts', { params }),
  getById: (id: string) => api.get(`/shifts/${id}`),
  create: (data: CreateShiftDto) => api.post('/shifts', data),
  close: (id: string) => api.post(`/shifts/${id}/close`),
  approve: (id: string) => api.post(`/shifts/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/shifts/${id}/reject`, { reason }),
};
```

---

## 6. Modul & Spesifikasi Fungsional

### 6.0 Prinsip UX dan Arsitektur Interaksi Global
Sistem ini harus dibangun dengan pengalaman pengguna yang konsisten di semua modul. Layout global wajib mencakup:
- Sidebar navigasi dengan grup Operasional, Monitoring, Administrasi.
- Topbar dengan notifikasi dan pemilihan branch aktif.
- Page header dengan judul, deskripsi, dan tombol aksi utama.
- Toolbar/filter untuk pencarian, rentang tanggal, branch, shift, unit, dan status.
- Card, table, badge status, modal, toast, dan tombol aksi.

Semua modul wajib mendukung alur CRUD dasar, validasi form, filter, status badge, dan respons yang jelas terhadap aksi pengguna.

### 6.1 Modul Autentikasi (Fase 1)

**Tujuan:**
- Menjamin akses hanya untuk user yang terotorisasi.
- Memisahkan role berdasarkan tugas operasional.

**Backend:**
- `POST /auth/login` — validasi email/username + password, mengembalikan JWT dan data profil.
- `GET /auth/me` — mengambil profil aktif.
- `POST /auth/logout` — invalidasi sesi client-side atau refresh token.
- Middleware JWT dan role-based access control.

**Frontend:**
- Halaman login dengan form username/email dan password.
- Tombol demo account untuk supervisor, admin SJ, admin lapangan, maintenance.
- Redirect ke dashboard setelah login berhasil.
- Jika token expired, redirect ke halaman login.

**Role & Permission Matrix:**

| Fitur | Admin Mining | Supervisor | General Admin | Super Admin |
|------|-------------|------------|---------------|-------------|
| Input Rit | ✓ | - | - | - |
| Input Delay | ✓ | - | - | - |
| Input BBM | ✓ | - | - | - |
| Input Maintenance | ✓ | - | - | - |
| Buka/Tutup Shift | ✓ | - | - | ✓ |
| Approve Shift | - | ✓ | - | ✓ |
| Approve Edit Request | - | ✓ | - | ✓ |
| Master Data | - | - | ✓ | ✓ |
| Settings / Users | - | - | ✓ | ✓ |
| Laporan | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✓ | ✓ | ✓ | ✓ |

### 6.2 Modul Dashboard (Fase 1)

**Tujuan:**
- Memberi ringkasan harian cepat tentang performa operasi hauling.

**Backend:**
- Query KPI harian: ritase, tonase, revenue estimasi, unit aktif, PA, UA, cycle time, BBM, delay.
- Aggregasi data shift aktif dan 7 hari terakhir.
- Alert generation untuk over budget, data belum lengkap, mismatch, dan unit breakdown.

**Frontend:**
- Header halaman dengan badge shift aktif.
- Tombol filter: Today, Yesterday, 3 Days Ago, 7 Days Ago, dan custom date range.
- KPI cards: total ritase, total tonase, estimasi revenue, unit aktif, PA, UA, avg cycle time, produktivitas.
- Grafik tonase 7 hari terakhir.
- Panel delay hari ini vs budget.
- Grid status armada per unit.
- Panel alert / perlu perhatian.
- Tabel surat jalan terbaru dengan tombol “Lihat Semua”.
- Tombol aksi: “Lihat Detail Shift”, “Kelola Maintenance”, “Lihat Semua” di delay/rit/approval.

### 6.3 Modul Shift Management (Fase 1)

**Tujuan:**
- Mengelola lifecycle shift harian dari buka sampai ditutup dan disetujui.

**Backend:**
- CRUD shift dengan validasi branch, tanggal, dan tipe shift.
- Auto-calculate jam mulai/selesai berdasarkan tipe shift.
- Validasi saat close shift: status unit, missing data, dan UA/PA warnings.
- Status flow: `open → pending → approved/rejected`.

**Frontend:**
- Halaman utama dengan header aksi: “Riwayat Shift” dan “Buka Shift Baru”.
- Banner shift aktif yang menampilkan shift berjalan, durasi, jumlah unit aktif, dan branch.
- Filter date/branch/tipe shift.
- Tabel daftar shift dengan kolom tanggal, branch, tipe shift, jam operasi, unit aktif, ritase, tonase, status, dan aksi.
- Modal “Buka Shift Baru”: pilih branch, tanggal, tipe shift, isi jam auto, assign unit, operator, dan material.
- Tombol “Generate dari Tanggal Lain” dan “Generate Semua Unit Aktif”.
- Modal “Detail Shift” dengan tab KPI Summary, Unit & Operator, Rit Operation, Delay, BBM, Maintenance.
- Modal “Tutup Shift” yang menampilkan ringkasan performa dan validasi warning sebelum submit.
- Setelah shift ditutup, status berubah ke pending approval.

### 6.4 Modul Rit Operation (Fase 1–2)

**Tujuan:**
- Mencatat ritase operasi hauling secara detail, termasuk data timbangan dan estimasi.

**Backend:**
- CRUD rit operation dengan validasi unit harus ada di shift aktif.
- Auto-generate nomor rit: `{BRANCH_PREFIX}-{YYYYMMDD}-{SEQ}`.
- Perhitungan netto otomatis: gross − tare.
- Validasi status timbangan: manual, pending, imported, mismatch, estimasi.
- Support import Excel vendor timbangan bila branch memakai skema WITH_TIMBANGAN.
- Edit request untuk data yang sudah approved.

**Frontend:**
- Header halaman dengan tombol utama untuk input rit, import Excel, filter, dan export.
- Summary bar di atas grid: total record, total rit, total tonase, jumlah approved/pending.
- Filter bar: tanggal, branch, shift, material, unit, tipe unit, status timbangan.
- Grid data rit dengan kolom utama: nomor rit, tanggal, unit, operator, pit, material, stockpile, jumlah rit, jarak, gross, tare, netto, catatan.
- Tombol aksi per baris: edit, lihat detail, kirim edit request.
- Modal input rit: pengisian identitas rit, detail pengangkutan, data timbangan, dan auto-compute netto.
- Modal import Excel: upload file, mapping kolom, preview, dan simpan.
- Jika data sudah approved, sistem wajib menampilkan opsi “Ajukan Edit” daripada edit langsung.

### 6.5 Modul Delay (Fase 1–2)

**Tujuan:**
- Mencatat setiap delay operasional dan membandingkannya terhadap budget.

**Backend:**
- CRUD delay dengan scope fleet-wide atau per unit.
- Delay type mengandung kategori, budget menit, dan flag `kenaPA`.
- Validasi durasi, rentang waktu, dan batas maksimum per unit per hari.
- Summary actual vs budget per jenis delay.

**Frontend:**
- Header halaman dengan tombol “Input Delay Fleet” dan “Input Delay Per Unit”.
- Filter: dari tanggal, sampai tanggal, shift, scope, kategori.
- Kartu ringkasan budget vs real-time per jenis delay dengan badge over budget.
- Tabel log delay dengan kolom tanggal, jenis, kategori, scope, start/close, durasi, budget, status, aksi.
- Modal fleet-wide: pilih jenis delay, lihat budget otomatis, pilih jam mulai/selesai atau full day, pilih unit yang terdampak, isi keterangan, simpan.
- Modal per unit: pilih unit, jenis delay, jam mulai/selesai, durasi otomatis, budget otomatis, simpan.
- Tombol pilih semua/batalkan semua unit pada modal fleet.

### 6.6 Modul Maintenance & Downtime (Fase 1–2)

**Tujuan:**
- Memantau downtime unit secara harian dan membandingkannya dengan budget breakdown jam.

**Backend:**
- CRUD maintenance dengan batas satu record per unit per shift.
- Perhitungan actual vs budget jam.
- Jenis downtime: Breakdown, PM, Full Day BD, Standby, Ready.
- Full day breakdown auto-fill 07:00–17:00 (10 jam) sesuai prototype.

**Frontend:**
- Header halaman dengan tombol “Generate dari Data Lain” dan “Input Downtime”.
- Filter: tanggal, branch, unit, tipe unit, status.
- KPI cards: unit ready, breakdown, PM, over budget.
- Dua area tampilan: Issues (Breakdown / PM / Full Day BD) dan Ready Units.
- Tabel issue menampilkan actual vs budget dengan progress bar dan badge status.
- Modal input downtime: pilih tanggal, branch, unit, jenis downtime, status ongoing/completed, jam mulai/selesai, durasi otomatis, budget unit, keterangan, part yang diganti.
- Modal generate dari tanggal lain untuk menyalin data downtime sebelumnya sebagai starting point.

### 6.7 Modul BBM (Fase 1–2)

**Tujuan:**
- Mencatat pengisian BBM dan menganalisis efisiensi konsumsi bahan bakar.

**Backend:**
- CRUD BBM log per unit per shift.
- Validasi odometer dan hour meter harus naik dari data sebelumnya.
- Perhitungan ratio: jam/liter, km/liter, liter/ton (opsional).

**Frontend:**
- Header halaman dengan tombol “Input Pengisian BBM”.
- KPI cards: total BBM hari ini, total transaksi, unit terisi, budget BBM.
- Ratio cards: Fuel Ratio Jam/L dan Km/Liter.
- Filter: tanggal, branch, shift, unit, tipe unit, lokasi isi.
- Tabel log BBM dengan kolom tanggal, shift, branch, unit, operator BBM, jam, lokasi, liter, odometer, HM, keterangan, aksi.
- Modal input BBM multi-baris: pilih branch, tanggal, shift, lalu input beberapa baris pengisian BBM sekaligus.
- Tombol toolbar di modal: Isi ke Bawah, Hapus, Baris Baru, Simpan Semua.
- Sistem wajib menampilkan total liter dan jumlah baris sebelum disimpan.

### 6.8 Modul Actual Operation (Fase 2)

**Tujuan:**
- Menampilkan status unit harian dalam bentuk matrix agar tim dapat memantau availability dan produktivitas secara cepat.

**Backend:**
- CRUD status per unit per hari.
- Matrix query untuk rows unit dan columns tanggal.
- Calculation PA%, UA%, produktivitas per periode.
- Export CSV/Excel.

**Frontend:**
- Halaman dengan KPI ringkas dan legend status.
- Tombol “Generate VOR”, “Export”, dan filter branch/tipe unit/search unit.
- Matrix status armada berwarna.
- Klik cell untuk membuka modal edit status dan catatan.
- Tampilan harus support mode harian/mingguan/bulanan sesuai kebutuhan.

### 6.9 Modul Approval & Edit Request (Fase 2–3)

**Tujuan:**
- Menyediakan alur review dan persetujuan data penting sebelum data dianggap final.

**Backend:**
- Endpoint list pending shift approval.
- Bulk approve/reject shift.
- CRUD edit request untuk rit, delay, bbm, maintenance.
- Audit trail setiap aksi approval/rejection dengan timestamp dan user.

**Frontend:**
- 3 tab: Approval Shift, Edit Request, Riwayat.
- Pada tab Approval Shift: card per shift pending, checkbox pilih semua, tombol bulk approve/reject, input timestamp review, tombol detail, approve/reject individual.
- Pada tab Edit Request: card per request dengan detail field, nilai lama, nilai baru, alasan, dan tombol approve/reject.
- Modal reject memerlukan alasan penolakan.
- Riwayat menampilkan timestamp, tipe, subjek, aksi, dan nama user.

### 6.10 Modul Laporan (Fase 3)

**Tujuan:**
- Menyediakan laporan operasional yang siap dipakai untuk analisa dan audit.

**Backend:**
- Daily report aggregation per unit: ritase, tonase, PA, UA, EWH, cycle time, BBM, revenue estimation.
- Delay summary actual vs budget.
- Maintenance report breakdown/PM.
- Monthly recap dan trend data.
- Export Excel/CSV.

**Frontend:**
- Tab Daily Report, Delay Summary, BBM Report, Maintenance, Rekap Bulanan.
- Filter per tab: tanggal, shift, branch, unit, material, status.
- Tabel data dengan warna status dan export button.
- Tab bulanan menampilkan KPI cards dan chart trend.

### 6.11 Modul Settings (Fase 3)

**Tujuan:**
- Mengelola user, branch, role, dan profil akun.

**Backend:**
- CRUD user, branch, dan role definition.
- Password management dan audit trail.

**Frontend:**
- Tab User Management, Branch, Role & Akses, Profil Saya.
- Tombol tambah user/branch.
- Modal form create/edit user dan branch.
- Form change password dan profil pengguna.

### 6.12 Aturan Bisnis Kritis yang Harus Diimplementasikan
- Setiap data operasional harus terkait dengan branch dan shift yang valid.
- Unit hanya boleh masuk ke satu shift aktif per hari.
- Delay fleet-wide harus mampu mereferensikan banyak unit sekaligus.
- Maintenance hanya satu record per unit per shift.
- BBM harus mengacu pada shift yang aktif dan unit yang valid.
- Approval wajib ada untuk data yang bersifat final.
- Edit request wajib mencatat siapa yang mengajukan, apa yang berubah, dan alasan perubahan.
- Semua transaksi harus menyertakan timestamp dan user ID pembuat.

---

## 7. Rencana Implementasi per Fase

### Fase 1: Foundation (Minggu 1–4)

| Sprint | Modul | Deliverables |
|--------|-------|-------------|
| **Sprint 1** | Project Setup | Monorepo, Express scaffold, Prisma schema, migrations, seed data, Docker compose, CI/CD |
| **Sprint 1** | Auth | Login/register API, JWT middleware, role middleware, Login page |
| **Sprint 2** | Master Data (Backend) | All CRUD endpoints: Unit, TipeUnit, Operator, Material, Pit, Stockpile, Rate, DelayType, StatusOperation, Budget targets |
| **Sprint 2** | Master Data (Frontend) | Master page with 10 tabs, CRUD modals, filter/pagination |
| **Sprint 3** | Shift (Backend + Frontend) | Shift CRUD API, Shift page, Buka/Tutup modal, unit assignment, UA% validation |
| **Sprint 3** | Shared UI Library | Button, Card, Modal, Table, Badge, Tabs, Input, Select, Pagination, Toast, FilterBar |

**Milestone Fase 1: User dapat login, mengelola master data, dan membuka/menutup shift.**

### Fase 2: Core Transaction (Minggu 5–10)

| Sprint | Modul | Deliverables |
|--------|-------|-------------|
| **Sprint 4** | Rit Operation (Backend) | Rit CRUD, auto-generate noRit, netto calculation, import Excel, grouping query, edit request |
| **Sprint 4** | Rit Operation (Frontend) | Rit page, input modal, import modal, visual grouping, summary bar |
| **Sprint 5** | Delay (Backend + Frontend) | Delay CRUD, fleet-wide support, budget vs realtime, max 10h validation |
| **Sprint 5** | Maintenance (Backend + Frontend) | Maintenance CRUD, two-table layout (issues + ready), actual vs budget bars |
| **Sprint 6** | BBM (Backend + Frontend) | BBM log CRUD, auto-fetch Odo/HM, validasi Odo, Jam/L ratio |
| **Sprint 6** | Actual Operation (Backend + Frontend) | Status matrix CRUD, weekly/monthly view, color-coded cells, CSV export |

**Milestone Fase 2: Semua input transaksi harian dapat dilakukan (rit, delay, maintenance, BBM, actual status).**

### Fase 3: Approval & Reporting (Minggu 11–14)

| Sprint | Modul | Deliverables |
|--------|-------|-------------|
| **Sprint 7** | Approval (Backend + Frontend) | Bulk approve/reject API, shift approval cards, edit request review, history |
| **Sprint 7** | Dashboard (Backend + Frontend) | KPI aggregation, chart data, fleet status, alerts, recent rits |
| **Sprint 8** | Laporan (Backend + Frontend) | Daily report, delay summary, BBM report, maintenance report, bulanan recap, Excel export |
| **Sprint 8** | Settings (Backend + Frontend) | User management, branch config, roles, profile |
| **Sprint 9** | Integration & Polish | End-to-end flow testing, bug fixes, responsive polish, loading states, error handling |

**Milestone Fase 3: Supervisor dapat approve shift, dashboard menampilkan KPI, laporan dapat diexport.**

### Fase 4: Hardening & Deploy (Minggu 14–16)

| Task | Detail |
|------|--------|
| **Performance testing** | Query optimization, pagination tuning, N+1 elimination |
| **Security audit** | Input validation, XSS prevention, rate limiting |
| **Documentation** | Swagger/OpenAPI, README, deployment guide, user manual |
| **Deployment** | Docker compose production, Nginx config, SSL, backup strategy, monitoring (PM2 / sentry) |
| **UAT** | User acceptance testing dengan sample data |
| **Training** | User training material + walkthrough |

**Milestone Fase 4: Sistem siap produksi.**

### Timeline Visual

```
Minggu:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
Fase 1:  [====Project Setup====]
         [====Auth============]
         [====Master Data============]
         [====Shift + UI Lib=============]
Fase 2:              [====Rit Operation============]
                     [====Delay + Maintenance============]
                     [====BBM + Actual Op=================]
Fase 3:                              [====Approval========]
                                      [====Dashboard======]
                                      [====Laporan========]
                                      [====Settings=======]
Fase 4:                                           [====Hardening + Deploy====]
```

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| API response time (80th percentile) | < 500ms | All endpoints |
| API response time (report aggregation) | < 2s | Laporan endpoints |
| Page load (first contentful paint) | < 1.5s | Lighthouse |
| Time to interactive | < 3s | Lighthouse |
| Concurrent users | 50+ | Load test |
| Database query time (with pagination) | < 200ms | EXPLAIN ANALYZE |

### 8.2 Security

| Requirement | Implementation |
|-------------|---------------|
| Password hashing | bcryptjs, 12 rounds |
| Authentication | JWT (RS256 or HS256), 8h expiry |
| Input validation | Zod schemas on all endpoints |
| SQL injection | Prisma prepared statements (built-in) |
| XSS | React auto-escape, Content-Security-Policy headers |
| Rate limiting | express-rate-limit: 100 req/min per IP |
| CORS | Whitelist frontend origin only |
| Helmet | HTTP security headers |

### 8.3 Data Integrity

| Requirement | Implementation |
|-------------|---------------|
| Foreign key constraints | Prisma relations + cascading |
| Unique constraints | Prisma @@unique pada field critical (noRit, dll) |
| Soft delete | `aktif` boolean field (bukan hard delete) |
| Audit trail | Approval + EditRequest tables |
| Validation | Zod di layer API + React Hook Form + Zod di client |

### 8.4 Availability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% (monthly) |
| Backup frequency | Daily PostgreSQL dump |
| Recovery time | < 4 jam |
| Maintenance window | Minggu 02:00–04:00 |

### 8.5 Scalability

| Layer | Strategy |
|-------|----------|
| Database | Indexes on all FK + query columns; connection pooling (pgBouncer) |
| API | Horizontal scaling via Docker + Nginx load balancing |
| Frontend | Static build via Vite, CDN cache (Cloudflare) |
| File storage | MinIO / S3 for Excel uploads |

### 8.6 Accessibility & UX

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG AA minimum |
| Keyboard navigation | All interactive elements reachable via Tab |
| Screen reader | aria-label pada icon-only buttons |
| Loading states | Skeleton loaders for tables, spinner for buttons |
| Error messages | User-friendly, not technical |
| Empty states | Guidance text + action button |
| Confirmations | Before destructive actions (delete, reject) |

---

## 9. Deployment Strategy

### 9.1 Development Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: hauloops
      POSTGRES_USER: haulops
      POSTGRES_PASSWORD: haulops_dev

  server:
    build: ./packages/server
    ports: ['3001:3001']
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql://haulops:haulops_dev@postgres:5432/hauloops
      JWT_SECRET: dev-secret-key-change-in-production
    volumes: ['./packages/server/src:/app/src']

  web:
    build: ./packages/web
    ports: ['5173:5173']
    depends_on: [server]
    environment:
      VITE_API_URL: http://localhost:3001/api/v1
    volumes: ['./packages/web/src:/app/src']

volumes:
  pgdata:
```

### 9.2 Production Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    volumes: ['pgdata:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: haulops
      POSTGRES_USER: haulops
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U haulops']
      interval: 10s

  server:
    build:
      context: ./packages/server
      dockerfile: Dockerfile
    restart: always
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgresql://haulops:${DB_PASSWORD}@postgres:5432/hauloops
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    expose: ['3001']

  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    restart: always
    depends_on: [server]
    expose: ['80']

  nginx:
    image: nginx:alpine
    restart: always
    ports: ['80:80', '443:443']
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - certbot-data:/var/www/certbot
    depends_on: [server, web]

  certbot:
    image: certbot/certbot
    volumes: [certbot-data:/var/www/certbot]
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done'"

volumes:
  pgdata:
  certbot-data:
```

### 9.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  deploy:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/hauloops
            git pull origin main
            docker compose -f docker-compose.prod.yml down
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T server npx prisma migrate deploy
```

### 9.4 Monitoring & Logging

| Tool | Fungsi |
|------|--------|
| PM2 | Process manager untuk Node.js (auto-restart) |
| Sentry | Error tracking (server + client) |
| Grafana + Prometheus | Opsional untuk metrics lanjutan |
| Pino | Structured JSON logging |
| healthcheck (`GET /api/v1/health`) | Uptime monitoring |

---

## 10. Testing Strategy

### 10.1 Testing Levels

| Level | Tools | Coverage Target |
|-------|-------|-----------------|
| Unit (Backend) | Vitest + Supertest | 80%+ (services, controllers, middleware) |
| Unit (Frontend) | Vitest + React Testing Library | 70%+ (hooks, utils, components) |
| Integration | Vitest + Prisma test DB | API flow tests per modul |
| E2E | Playwright | Critical paths: login → shift → rit → approval → laporan |
| Manual QA | Checklist per modul | 100% sebelum release |

### 10.2 Test Structure

```
packages/server/src/
└── modules/
    └── shift/
        ├── shift.service.ts
        ├── shift.controller.ts
        ├── shift.routes.ts
        ├── shift.schema.ts
        └── __tests__/
            ├── shift.service.test.ts
            ├── shift.controller.test.ts
            └── shift.integration.test.ts

packages/web/src/
├── components/
│   └── ui/
│       └── __tests__/
│           ├── Button.test.tsx
│           ├── Modal.test.tsx
│           └── Table.test.tsx
└── pages/
    └── shift/
        └── __tests__/
            └── ShiftPage.test.tsx
```

### 10.3 Critical Test Scenarios

| Scenario | Modul | Flow |
|----------|-------|------|
| **Happy path shift** | Shift → Rit → Approval → Laporan | Buka shift → input rit → tutup shift → approve → laporan muncul |
| **Bulk approval** | Approval | Select multiple shifts → approve → status berubah |
| **UA% validation** | Shift | Unit dengan rit >0 tapi UA=0 → block close shift |
| **Delay max 10h** | Delay | Total delay > 600 menit → validation error |
| **Odometer validation** | BBM | Input odo < previous odo → error |
| **EWH calculation** | Laporan | EWH = Jam tersedia − delay − maintenance |
| **Color coding** | Laporan | EWH ≥8 = green, ≥4 = orange, <4 = red |
| **Role access** | Auth | Admin Mining tidak bisa approve shift, Supervisor tidak bisa edit master data |

---

## 11. Glossary

| Term | Definisi |
|------|----------|
| **PA (Physical Availability)** | Persentase waktu unit tersedia secara fisik untuk beroperasi. Rumus: `(Total Jam − Delay yang kena PA) / Total Jam × 100%` |
| **UA (Unit Availability)** | Persentase waktu unit siap operasi (setelah dikurangi delay + maintenance). Rumus: `(Total Jam − Total Delay − Total Maintenance) / Total Jam × 100%` |
| **MA (Mechanical Availability)** | Persentase ketersediaan mekanis unit (tidak dalam keadaan breakdown) |
| **EWH (Effective Working Hours)** | Jam kerja efektif setelah dikurangi total delay dan total maintenance. `EWH = Jam Tersedia − Σ Delay − Σ Maintenance` |
| **Cycle Time** | Waktu rata-rata per ritase. `Cycle Time = EWH / Jumlah Rit` (dalam jam/rit) |
| **Jam/L** | Rasio konsumsi BBM: jam operasi per liter. `Jam/L = Jam Operasi / Total Liter` |
| **DT (Dump Truck)** | Unit angkut material tambang |
| **Pit** | Area loading / sumber material yang ditambang |
| **ROM (Run of Mine)** | Stockpile utama tempat material ditumpuk sebelum diproses |
| **Disposal** | Area pembuangan overburden (material non-ore) |
| **Gross** | Berat kotor unit + material saat ditimbang |
| **Tare** | Berat kosong unit (tanpa material) |
| **Netto** | Gross − Tare = berat bersih material yang diangkut |
| **WITH_TIMBANGAN** | Skema branch yang menggunakan data timbangan dari vendor eksternal |
| **WITHOUT_TIMBANGAN** | Skema branch tanpa timbangan — menggunakan estimasi kapasitas unit |
| **HM (Hour Meter)** | Akumulasi jam operasi mesin unit |
| **Odo (Odometer)** | Akumulasi jarak tempuh unit (km) |
| **VOR (Visual Operator Report)** | Laporan visual status setiap unit pada setiap hari dalam suatu periode |
| **Fleet Wide Delay** | Delay yang berdampak ke semua unit aktif (contoh: hujan, safety talk) |
| **Unit Delay** | Delay yang spesifik pada satu unit (contoh: ganti ban, breakdown) |
| **Over Budget** | Kondisi dimana realisasi melebihi budget/target yang ditetapkan |
| **Fase** | Tahapan pengembangan sistem — setiap fase menghasilkan rilis yang dapat diuji |
| **Sprint** | Siklus pengembangan 1 minggu dalam metodologi Agile |

---

## Appendix A: Prisma Seed Data Strategy

```typescript
// prisma/seed.ts
async function main() {
  // 1. Buat Branch
  const branch1 = await prisma.branch.create({
    data: { kode: 'NPM-KON', nama: 'Project NPM Konawe', skemaTimbangan: 'WITH_TIMBANGAN' }
  });
  const branch2 = await prisma.branch.create({
    data: { kode: 'CLM-LR', nama: 'Project CLM Luwu Raya', skemaTimbangan: 'WITH_TIMBANGAN' }
  });
  const branch3 = await prisma.branch.create({
    data: { kode: 'PPS-ST', nama: 'Project PPS Sultra', skemaTimbangan: 'WITHOUT_TIMBANGAN' }
  });

  // 2. Buat Tipe Unit
  const tipeKecil = await prisma.tipeUnit.create({
    data: { kode: 'DT-KECIL', nama: 'DT Kecil', kapasitasTon: 20, budgetBreakdownJam: 3 }
  });
  const tipeBesar = await prisma.tipeUnit.create({
    data: { kode: 'DT-BESAR', nama: 'DT Besar', kapasitasTon: 40, budgetBreakdownJam: 4 }
  });

  // 3. Buat Unit (5 DT Kecil + 3 DT Besar per branch)
  // ...

  // 4. Buat Operator (5 per branch)
  // ...

  // 5. Buat Material
  // ...

  // 6. Buat Status Operation (8 statuses)
  // ...

  // 7. Buat User (Admin Mining, Supervisor, General Admin per branch)
  // ...
}
```

## Appendix B: Query Optimization Notes

### Daily Report Query (Optimized)

```sql
-- Gunakan CTE untuk menghitung agregasi per unit
WITH rit_stats AS (
  SELECT
    u.id AS unit_id,
    u.kode,
    COUNT(r.id) AS total_rit,
    COALESCE(SUM(r.netto_ton), 0) AS total_tonase
  FROM "Unit" u
  LEFT JOIN "Rit" r ON r.unit_id = u.id AND r.shift_id = :shiftId
  WHERE u.branch_id = :branchId
  GROUP BY u.id, u.kode
),
delay_stats AS (
  SELECT
    d.unit_id,
    COALESCE(SUM(d.durasi_menit), 0) AS total_delay_menit
  FROM "Delay" d
  WHERE d.shift_id = :shiftId
  GROUP BY d.unit_id
),
maint_stats AS (
  SELECT
    m.unit_id,
    COALESCE(SUM(m.durasi_jam), 0) AS total_maint_jam
  FROM "Maintenance" m
  WHERE m.shift_id = :shiftId
  GROUP BY m.unit_id
)
SELECT
  rs.kode AS unit,
  rs.total_rit,
  rs.total_tonase,
  -- EWH = 8 jam - (delay_menit/60) - maint_jam
  (8 - COALESCE(ds.total_delay_menit, 0) / 60.0 - COALESCE(ms.total_maint_jam, 0)) AS ewh_jam
FROM rit_stats rs
LEFT JOIN delay_stats ds ON ds.unit_id = rs.unit_id
LEFT JOIN maint_stats ms ON ms.unit_id = rs.unit_id
ORDER BY rs.kode;
```

### Index Recommendations

```sql
CREATE INDEX idx_rit_shift_unit ON "Rit"(shift_id, unit_id);
CREATE INDEX idx_delay_shift_unit ON "Delay"(shift_id, unit_id);
CREATE INDEX idx_maintenance_shift_unit ON "Maintenance"(shift_id, unit_id);
CREATE INDEX idx_bbm_shift_unit ON "BBMLog"(shift_id, unit_id);
CREATE INDEX idx_actual_status_unit_date ON "ActualStatus"(unit_id, tanggal);
CREATE INDEX idx_shift_branch_status ON "Shift"(branch_id, status, tanggal);
```

---

*Dokumen ini disusun untuk panduan pembangunan sistem Hauling Operations Monitoring System (HAULOPS v2.0). Untuk pertanyaan atau klarifikasi, hubungi System Engineer.*
