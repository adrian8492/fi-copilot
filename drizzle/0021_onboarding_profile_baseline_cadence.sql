ALTER TABLE `dealership_settings` ADD `vsaPenBaseline` float;--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `gapPenBaseline` float;--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `appearancePenBaseline` float;--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `chargebackRateBaseline` float;--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `citAgingBaseline` float;--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `coachingCadenceDay` varchar(10);--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `coachingCadenceTime` varchar(8);--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `coachingRunBy` enum('fi_director','asura_coach','dp','other');--> statement-breakpoint
ALTER TABLE `dealership_settings` ADD `pru90DayTarget` int;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `dealerships` ADD `brandMix` json;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `unitVolumeMonthly` int;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `pruBaseline` int;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `pruTarget` int;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `onboardingComplete` boolean DEFAULT false NOT NULL;