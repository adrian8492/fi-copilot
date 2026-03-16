CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(128) NOT NULL,
	`email` varchar(320),
	`dealershipId` int NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`invitedBy` int NOT NULL,
	`usedBy` int,
	`usedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_token_unique` UNIQUE(`token`)
);
