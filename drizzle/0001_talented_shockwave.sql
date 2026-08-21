CREATE TABLE `guestbook_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`authorName` varchar(40) NOT NULL,
	`message` varchar(500) NOT NULL,
	`isHidden` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guestbook_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`babyName` varchar(80) NOT NULL,
	`invitationTitle` varchar(180) NOT NULL,
	`greeting` text NOT NULL,
	`eventDate` varchar(32) NOT NULL,
	`eventTime` varchar(64) NOT NULL,
	`venueName` varchar(160) NOT NULL,
	`venueAddress` varchar(255) NOT NULL,
	`parkingInfo` text NOT NULL,
	`heroImageUrl` text,
	`galleryImageUrls` text,
	`accountInfo` text NOT NULL,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rsvp_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`editToken` varchar(96) NOT NULL,
	`name` varchar(80) NOT NULL,
	`attendance` enum('attending','unable') NOT NULL,
	`adults` int NOT NULL DEFAULT 0,
	`children` int NOT NULL DEFAULT 0,
	`meal` int NOT NULL DEFAULT 1,
	`contact` varchar(40),
	`note` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rsvp_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `rsvp_responses_editToken_unique` UNIQUE(`editToken`)
);
