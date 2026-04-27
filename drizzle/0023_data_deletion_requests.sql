CREATE TABLE `data_deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`customerId` int,
	`sessionId` int,
	`requestedBy` int NOT NULL,
	`customerEmail` varchar(320),
	`customerName` varchar(255),
	`reason` varchar(500),
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledDeletionAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	`cancelledBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ix_ddr_dealership_id` ON `data_deletion_requests` (`dealershipId`);--> statement-breakpoint
CREATE INDEX `ix_ddr_scheduled_deletion_at` ON `data_deletion_requests` (`scheduledDeletionAt`);