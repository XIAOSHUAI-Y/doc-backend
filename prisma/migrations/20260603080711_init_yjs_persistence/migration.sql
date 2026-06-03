-- CreateTable
CREATE TABLE "YjsDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "YjsUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "update" BLOB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YjsUpdate_docId_fkey" FOREIGN KEY ("docId") REFERENCES "YjsDocument" ("docId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "YjsDocument_docId_key" ON "YjsDocument"("docId");

-- CreateIndex
CREATE INDEX "YjsUpdate_docId_version_idx" ON "YjsUpdate"("docId", "version");
