CREATE TABLE `dealership_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealership_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealership_groups_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_rooftop_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dealershipId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_rooftop_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `copilot_suggestions` MODIFY COLUMN `type` enum('product_recommendation','objection_handling','compliance_reminder','rapport_building','closing_technique','general_tip','language_correction','process_alert','professional_hello','customer_connection','financial_snapshot','menu_transition','product_presentation','objection_prevention','objection_response','closing','compliance_disclosure','phone_script','admin_function','assuming_business','client_survey','needs_awareness','product_knowledge','ranking_process','transition') NOT NULL;--> statement-breakpoint
ALTER TABLE `copilot_suggestions` ADD `scriptId` varchar(64);--> statement-breakpoint
ALTER TABLE `dealerships` ADD `groupId` int;--> statement-breakpoint
ALTER TABLE `invitations` ADD `groupId` int;--> statement-breakpoint
ALTER TABLE `performance_grades` ADD `wordTrackUtilizationScore` float;--> statement-breakpoint
ALTER TABLE `users` ADD `isGroupAdmin` boolean DEFAULT false NOT NULL;