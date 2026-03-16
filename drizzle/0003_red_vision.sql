CREATE TABLE `compliance_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('federal_tila','federal_ecoa','federal_udap','federal_cla','contract_element','fi_product_disclosure','process_step','custom') NOT NULL DEFAULT 'custom',
	`triggerKeywords` json NOT NULL,
	`requiredPhrase` text,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'warning',
	`weight` float NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`dealStage` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `compliance_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `script_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scriptText` text NOT NULL,
	`scriptCategory` enum('professional_hello','customer_connection','financial_snapshot','menu_transition','product_presentation','objection_prevention','objection_response','closing','phone_script','compliance_disclosure') NOT NULL,
	`dealStage` varchar(64) NOT NULL,
	`intentTrigger` varchar(255) NOT NULL,
	`triggerKeywords` json NOT NULL,
	`sourceDocument` varchar(255) NOT NULL,
	`productContext` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `script_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `scriptFidelityScore` float;--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `processAdherenceScore` float;--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `menuSequenceScore` float;--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `objectionResponseScore` float;--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `transitionAccuracyScore` float;