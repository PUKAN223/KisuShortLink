CREATE TABLE `links` (
	`slug` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`created_at` integer NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL
);
