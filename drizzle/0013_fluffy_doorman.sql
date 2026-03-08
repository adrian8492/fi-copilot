CREATE TABLE `dealership_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`maxSessionDuration` int NOT NULL DEFAULT 120,
	`autoGradeEnabled` boolean NOT NULL DEFAULT true,
	`requireCustomerName` boolean NOT NULL DEFAULT true,
	`requireDealNumber` boolean NOT NULL DEFAULT false,
	`consentMethod` enum('verbal','written','electronic') NOT NULL DEFAULT 'verbal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealership_settings_dealershipId_unique` UNIQUE(`dealershipId`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `vehicleYear` varchar(8);--> statement-breakpoint
ALTER TABLE `sessions` ADD `vehicleMake` varchar(64);--> statement-breakpoint
ALTER TABLE `sessions` ADD `vehicleModel` varchar(64);--> statement-breakpoint
ALTER TABLE `sessions` ADD `vin` varchar(17);--> statement-breakpoint
ALTER TABLE `sessions` ADD `salePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `sessions` ADD `tradeValue` decimal(10,2);--> statement-breakpoint
ALTER TABLE `sessions` ADD `amountFinanced` decimal(10,2);--> statement-breakpoint
ALTER TABLE `sessions` ADD `lenderName` varchar(128);--> statement-breakpoint
ALTER TABLE `sessions` ADD `apr` decimal(5,3);--> statement-breakpoint
ALTER TABLE `sessions` ADD `term` int;--> statement-breakpoint
ALTER TABLE `sessions` ADD `monthlyPayment` decimal(10,2);