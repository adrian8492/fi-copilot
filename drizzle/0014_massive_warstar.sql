ALTER TABLE `sessions` RENAME COLUMN `term` TO `termMonths`;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `vehicleYear` varchar(4);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `vehicleModel` varchar(128);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `salePrice` float;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `tradeValue` float;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `amountFinanced` float;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `lenderName` varchar(255);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `apr` float;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `monthlyPayment` float;