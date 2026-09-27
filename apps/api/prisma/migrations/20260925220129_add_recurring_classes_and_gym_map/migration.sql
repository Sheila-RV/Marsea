-- AlterTable
ALTER TABLE "ClassSession" ADD COLUMN     "recurringClassId" TEXT;

-- AlterTable
ALTER TABLE "Discipline" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "mapX" DOUBLE PRECISION,
ADD COLUMN     "mapY" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "mapImageUrl" TEXT;

-- CreateTable
CREATE TABLE "RecurringClass" (
    "id" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[],
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "rangeStart" TIMESTAMP(3) NOT NULL,
    "rangeEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gymId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,

    CONSTRAINT "RecurringClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringClass_gymId_idx" ON "RecurringClass"("gymId");

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringClass" ADD CONSTRAINT "RecurringClass_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_recurringClassId_fkey" FOREIGN KEY ("recurringClassId") REFERENCES "RecurringClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
