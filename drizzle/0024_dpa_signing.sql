ALTER TABLE `dealerships` ADD `dpaSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `dealerships` ADD `dpaVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `dealerships` ADD `dpaSignedBy` int;