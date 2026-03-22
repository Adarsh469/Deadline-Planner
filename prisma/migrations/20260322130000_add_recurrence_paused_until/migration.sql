-- Add pausedUntil to Recurrence table for temporary deactivation
ALTER TABLE `Recurrence` ADD COLUMN `pausedUntil` DATETIME(3) NULL;
