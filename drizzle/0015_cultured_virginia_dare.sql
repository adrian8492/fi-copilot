CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_menu` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealershipId` int NOT NULL,
	`productType` enum('vehicle_service_contract','gap_insurance','prepaid_maintenance','interior_exterior_protection','road_hazard','paintless_dent_repair','key_replacement','windshield_protection','lease_wear_tear','tire_wheel','theft_protection','other') NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`providerName` varchar(255),
	`description` text,
	`costToDealer` float,
	`retailPrice` float,
	`termMonths` int,
	`maxMileage` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_menu_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `customerId` int;