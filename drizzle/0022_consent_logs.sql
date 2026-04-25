CREATE TABLE `consent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`sessionId` int NOT NULL,
	`customerConsentAt` timestamp,
	`managerConsentAt` timestamp,
	`consentTextVersion` varchar(32) NOT NULL DEFAULT 'v1',
	`recordingMode` enum('pending','recording','manager_only') NOT NULL DEFAULT 'pending',
	`ipAddress` varchar(64),
	`deviceFingerprint` varchar(256),
	`revokedAt` timestamp,
	`revocationReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consent_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `consent_logs_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE INDEX `ix_consent_logs_dealership_id` ON `consent_logs` (`dealershipId`);