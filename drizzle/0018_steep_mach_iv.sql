CREATE TABLE `asura_scorecards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`tier1Score` float NOT NULL,
	`tier` varchar(32) NOT NULL,
	`menuOrderScore` float NOT NULL,
	`upgradeArchitectureScore` float NOT NULL,
	`objectionPreventionScore` float NOT NULL,
	`coachingCadenceScore` float NOT NULL,
	`menuOrderPillar` json,
	`upgradeArchitecturePillar` json,
	`objectionPreventionPillar` json,
	`coachingCadencePillar` json,
	`coachingPriorities` json,
	`gradedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asura_scorecards_id` PRIMARY KEY(`id`),
	CONSTRAINT `asura_scorecards_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);