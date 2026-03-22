-- Add schedule fields to Recurrence table
ALTER TABLE `Recurrence` ADD COLUMN `daysOfWeek` VARCHAR(191) NULL;
ALTER TABLE `Recurrence` ADD COLUMN `datesOfMonth` VARCHAR(191) NULL;
