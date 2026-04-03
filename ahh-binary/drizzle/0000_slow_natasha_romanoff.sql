CREATE TABLE `tunnel_mappings` (
	`subdomain` text PRIMARY KEY NOT NULL,
	`port` integer NOT NULL,
	`pid` integer NOT NULL,
	`created_at` integer NOT NULL
);
