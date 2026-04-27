ALTER TABLE `product_menu` ADD `pricingModel` enum('fixed_retail','cost_plus') DEFAULT 'fixed_retail' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_menu` ADD `markupAmount` float;--> statement-breakpoint
ALTER TABLE `product_menu` ADD `markupType` enum('dollar','percent');