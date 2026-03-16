ALTER TABLE `sessions` MODIFY COLUMN `customerName` varchar(512);--> statement-breakpoint
ALTER TABLE `sessions` ADD `consentTimestamp` timestamp;