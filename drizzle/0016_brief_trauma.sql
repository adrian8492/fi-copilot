CREATE TABLE `deal_recovery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`productType` enum('vehicle_service_contract','gap_insurance','prepaid_maintenance','interior_exterior_protection','road_hazard','paintless_dent_repair','key_replacement','windshield_protection','lease_wear_tear','tire_wheel','theft_protection','other') NOT NULL,
	`declineReason` text,
	`recoveryScript` text,
	`recoveryStatus` enum('pending','attempted','recovered','lost') NOT NULL DEFAULT 'pending',
	`potentialRevenue` float,
	`actualRevenue` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deal_recovery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_intelligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productType` enum('vehicle_service_contract','gap_insurance','prepaid_maintenance','interior_exterior_protection','road_hazard','paintless_dent_repair','key_replacement','windshield_protection','lease_wear_tear','tire_wheel','theft_protection','other') NOT NULL,
	`coverageSummary` text,
	`commonObjections` text,
	`objectionResponses` text,
	`sellingPoints` text,
	`asuraCoachingTips` text,
	`targetCustomerProfile` text,
	`avgCloseRate` float,
	`avgProfit` float,
	`complianceNotes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_intelligence_id` PRIMARY KEY(`id`)
);
