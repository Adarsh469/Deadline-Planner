-- CreateEnum
CREATE TYPE "DeadlinePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('UPCOMING', 'ESCALATING', 'OVERDUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" "DeadlinePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "category" TEXT,
    "urgencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurrenceId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineDependency" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadlineDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurrence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "DeadlinePriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "unit" "RecurrenceUnit" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deadlineId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Deadline_dueDate_idx" ON "Deadline"("dueDate");

-- CreateIndex
CREATE INDEX "Deadline_status_idx" ON "Deadline"("status");

-- CreateIndex
CREATE INDEX "Deadline_urgencyScore_idx" ON "Deadline"("urgencyScore");

-- CreateIndex
CREATE INDEX "Deadline_userId_dueDate_idx" ON "Deadline"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Deadline_userId_status_idx" ON "Deadline"("userId", "status");

-- CreateIndex
CREATE INDEX "Deadline_userId_priority_idx" ON "Deadline"("userId", "priority");

-- CreateIndex
CREATE INDEX "Deadline_userId_completedAt_idx" ON "Deadline"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "Deadline_recurrenceId_dueDate_idx" ON "Deadline"("recurrenceId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Deadline_recurrenceId_dueDate_key" ON "Deadline"("recurrenceId", "dueDate");

-- CreateIndex
CREATE INDEX "DeadlineDependency_blockedId_idx" ON "DeadlineDependency"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "DeadlineDependency_blockerId_blockedId_key" ON "DeadlineDependency"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Recurrence_userId_unit_idx" ON "Recurrence"("userId", "unit");

-- CreateIndex
CREATE INDEX "Recurrence_userId_startDate_idx" ON "Recurrence"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_seenAt_idx" ON "Notification"("userId", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_deadlineId_type_scheduledAt_key" ON "Notification"("userId", "deadlineId", "type", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineDependency" ADD CONSTRAINT "DeadlineDependency_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineDependency" ADD CONSTRAINT "DeadlineDependency_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Deadline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurrence" ADD CONSTRAINT "Recurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "Deadline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
