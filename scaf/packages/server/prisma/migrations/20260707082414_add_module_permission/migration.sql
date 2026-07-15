-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" TEXT NOT NULL,
    "moduleKode" TEXT NOT NULL,
    "moduleNama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "rolesAllowed" TEXT[],
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_moduleKode_key" ON "ModulePermission"("moduleKode");
