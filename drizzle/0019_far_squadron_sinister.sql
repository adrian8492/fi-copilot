ALTER TABLE `product_intelligence` ADD `category` enum('Protection','Appearance','Security');--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `displayName` varchar(255);--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `costRangeMin` int;--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `costRangeMax` int;--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `dealerCost` int;--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `commissionStructure` text;--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `stateRestrictions` text;--> statement-breakpoint
ALTER TABLE `product_intelligence` ADD `upsellRelationships` text;