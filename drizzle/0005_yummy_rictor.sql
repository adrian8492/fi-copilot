CREATE TABLE `dealerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`plan` enum('trial','beta','pro','enterprise') NOT NULL DEFAULT 'beta',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerships_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealerships_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `dealershipId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `dealershipId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isSuperAdmin` boolean DEFAULT false NOT NULL;