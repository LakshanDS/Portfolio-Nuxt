CREATE TABLE `AboutCard` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`icon` text NOT NULL,
	`iconColor` text NOT NULL,
	`content` text NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CmsSettings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`homepage` JSONB NOT NULL,
	`about` JSONB NOT NULL,
	`roadmap` JSONB NOT NULL,
	`projects` JSONB NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Comment` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`name` text,
	`email` text,
	`content` text NOT NULL,
	`isRead` BOOLEAN DEFAULT false NOT NULL,
	`country` text,
	`city` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `CoreCompetency` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`expertise` text NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`icon` text,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Education` (
	`id` text PRIMARY KEY NOT NULL,
	`institution` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Experience` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`position` text NOT NULL,
	`description` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`isCurrent` BOOLEAN DEFAULT false NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `LoginAttempt` (
	`id` text PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`resetAt` DATETIME NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `LoginAttempt_ip_key` ON `LoginAttempt` (`ip`);--> statement-breakpoint
CREATE TABLE `PageVisit` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`date` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`country` text,
	`city` text,
	`ipAddress` text,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PageVisit_ipAddress_path_date_key` ON `PageVisit` (`ipAddress`,`path`,`date`);--> statement-breakpoint
CREATE TABLE `Profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`bio` text NOT NULL,
	`email` text NOT NULL,
	`profileImage` text,
	`githubUrl` text NOT NULL,
	`linkedinUrl` text NOT NULL,
	`dateOfBirth` text,
	`gender` text,
	`address` text,
	`phone` text,
	`whatsappUrl` text,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ProfileStats` (
	`id` text PRIMARY KEY NOT NULL,
	`pipelinesFixed` text NOT NULL,
	`projectsCount` integer NOT NULL,
	`selfCommits` integer NOT NULL,
	`experience` text NOT NULL,
	`resumeDownloads` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ProfileStatus` (
	`id` text PRIMARY KEY NOT NULL,
	`isOpenToWork` BOOLEAN DEFAULT false NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Project` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`tags` text NOT NULL,
	`status` text NOT NULL,
	`imageUrl` text,
	`demoUrl` text,
	`repoUrl` text,
	`content` text,
	`displayOrder` integer DEFAULT 999 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `RateLimit` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`resetAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `RoadmapItem` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`tags` text NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Skill` (
	`id` text PRIMARY KEY NOT NULL,
	`categoryId` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`iconColor` text,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `SkillCategory`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `SkillCategory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`secret` text NOT NULL,
	`isRegistered` BOOLEAN DEFAULT true NOT NULL,
	`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
