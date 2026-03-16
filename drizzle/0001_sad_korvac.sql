CREATE TABLE `audio_recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(64),
	`fileSizeBytes` int,
	`durationSeconds` int,
	`status` enum('uploaded','processing','transcribed','failed') NOT NULL DEFAULT 'uploaded',
	`transcriptionProvider` varchar(64),
	`processedAt` timestamp,
	`retentionExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audio_recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64),
	`resourceId` varchar(64),
	`details` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`executiveSummary` text,
	`sentimentOverall` enum('positive','neutral','negative','mixed'),
	`sentimentManagerScore` float,
	`sentimentCustomerScore` float,
	`purchaseLikelihoodScore` float,
	`keyMoments` json,
	`productOpportunities` json,
	`objectionPatterns` json,
	`recommendations` text,
	`behaviorInsights` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `coaching_reports_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `compliance_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'warning',
	`rule` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`excerpt` text,
	`timestamp` float,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copilot_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`type` enum('product_recommendation','objection_handling','compliance_reminder','rapport_building','closing_technique','general_tip') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`triggeredBy` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`wasActedOn` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `copilot_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`rapportScore` float,
	`productPresentationScore` float,
	`objectionHandlingScore` float,
	`closingTechniqueScore` float,
	`complianceScore` float,
	`overallScore` float,
	`pvr` float,
	`productsPerDeal` float,
	`utilizationRate` float,
	`strengths` text,
	`improvements` text,
	`coachingNotes` text,
	`gradedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_grades_id` PRIMARY KEY(`id`),
	CONSTRAINT `performance_grades_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerName` varchar(255),
	`dealNumber` varchar(64),
	`vehicleType` enum('new','used','cpo') DEFAULT 'new',
	`dealType` enum('retail_finance','lease','cash') DEFAULT 'retail_finance',
	`status` enum('active','completed','processing','archived') NOT NULL DEFAULT 'active',
	`consentObtained` boolean NOT NULL DEFAULT false,
	`consentMethod` varchar(64),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`durationSeconds` int,
	`notes` text,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`speaker` enum('manager','customer','unknown') NOT NULL DEFAULT 'unknown',
	`text` text NOT NULL,
	`startTime` float,
	`endTime` float,
	`confidence` float,
	`isFinal` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transcripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `dealership` varchar(255);