-- CreateTable
CREATE TABLE "DefectEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "camera" INTEGER NOT NULL,
    "confidence" REAL NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "product" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "imageUrl" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SensorSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "temperature" REAL NOT NULL,
    "vibration" REAL NOT NULL,
    "pressure" REAL NOT NULL,
    "humidity" REAL NOT NULL,
    "speed" REAL NOT NULL,
    "current" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "environment" TEXT NOT NULL,
    "thresholds" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_environment_key" ON "SystemConfig"("environment");
