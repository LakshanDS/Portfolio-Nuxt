// Drizzle schema for Cloudflare D1 (SQLite dialect) — source of truth for
// `drizzle-kit generate` (DB_DIALECT=sqlite, default). Column layouts mirror
// the live D1 database exactly, including prisma-era types (DATETIME/BOOLEAN/
// JSONB) so the baseline migration is a faithful replay of it.
import { sql } from "drizzle-orm";
import {
  customType,
  foreignKey,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const datetime = customType<{ data: string; driverData: string }>({
  dataType: () => "DATETIME",
});
const boolean = customType<{ data: boolean; driverData: number }>({
  dataType: () => "BOOLEAN",
  toDriver: (value) => (value ? 1 : 0),
  fromDriver: (value) => Boolean(value),
});
const json = customType<{ data: unknown; driverData: string }>({
  dataType: () => "JSONB",
});

export const aboutCard = sqliteTable("AboutCard", {
  id: text().primaryKey(),
  title: text().notNull(),
  icon: text().notNull(),
  iconColor: text().notNull(),
  content: text().notNull(),
  displayOrder: integer().notNull().default(0),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const cmsSettings = sqliteTable("CmsSettings", {
  id: text().primaryKey().default("default"),
  homepage: json().notNull(),
  about: json().notNull(),
  roadmap: json().notNull(),
  projects: json().notNull(),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const project = sqliteTable("Project", {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  tags: text().notNull(),
  status: text().notNull(),
  // career.log placement — "2026" or "2026 Q1"; empty hides the project there
  year: text().notNull().default(""),
  imageUrl: text(),
  demoUrl: text(),
  repoUrl: text(),
  content: text(),
  displayOrder: integer().notNull().default(999),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const comment = sqliteTable(
  "Comment",
  {
    id: text().primaryKey(),
    projectId: text().notNull(),
    name: text(),
    email: text(),
    content: text().notNull(),
    isRead: boolean().notNull().default(false),
    country: text(),
    city: text(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    foreignKey({
      name: "Comment_projectId_fkey",
      columns: [table.projectId],
      foreignColumns: [project.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const coreCompetency = sqliteTable("CoreCompetency", {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  expertise: text().notNull(),
  tags: text().notNull().default(""),
  icon: text(),
  displayOrder: integer().notNull().default(0),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const education = sqliteTable("Education", {
  id: text().primaryKey(),
  institution: text().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  startDate: text().notNull(),
  endDate: text().notNull(),
  displayOrder: integer().notNull().default(0),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const experience = sqliteTable("Experience", {
  id: text().primaryKey(),
  company: text().notNull(),
  position: text().notNull(),
  description: text().notNull(),
  startDate: text().notNull(),
  endDate: text(),
  isCurrent: boolean().notNull().default(false),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const loginAttempt = sqliteTable(
  "LoginAttempt",
  {
    id: text().primaryKey(),
    ip: text().notNull(),
    count: integer().notNull().default(0),
    resetAt: datetime().notNull(),
    updatedAt: datetime().notNull(),
  },
  (table) => [uniqueIndex("LoginAttempt_ip_key").on(table.ip)],
);

export const pageVisit = sqliteTable(
  "PageVisit",
  {
    id: text().primaryKey(),
    path: text().notNull(),
    date: text().notNull(),
    count: integer().notNull().default(1),
    country: text(),
    city: text(),
    ipAddress: text(),
    createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime().notNull(),
  },
  (table) => [
    uniqueIndex("PageVisit_ipAddress_path_date_key").on(
      table.ipAddress,
      table.path,
      table.date,
    ),
  ],
);

export const profile = sqliteTable("Profile", {
  id: text().primaryKey(),
  name: text().notNull(),
  title: text().notNull(),
  bio: text().notNull(),
  email: text().notNull(),
  profileImage: text(),
  githubUrl: text().notNull(),
  linkedinUrl: text().notNull(),
  dateOfBirth: text(),
  gender: text(),
  address: text(),
  phone: text(),
  whatsappUrl: text(),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const profileStats = sqliteTable("ProfileStats", {
  id: text().primaryKey(),
  pipelinesFixed: text().notNull(),
  projectsCount: integer().notNull(),
  selfCommits: integer().notNull(),
  experience: text().notNull(),
  resumeDownloads: integer().notNull().default(0),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const profileStatus = sqliteTable("ProfileStatus", {
  id: text().primaryKey(),
  isOpenToWork: boolean().notNull().default(false),
  updatedAt: datetime().notNull(),
});

export const rateLimit = sqliteTable("RateLimit", {
  key: text().primaryKey(),
  count: integer().notNull(),
  resetAt: text().notNull(),
  updatedAt: text().notNull(),
});

export const roadmapItem = sqliteTable("RoadmapItem", {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  date: text().notNull(),
  category: text().notNull(),
  status: text().notNull(),
  tags: text().notNull(),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const skillCategory = sqliteTable("SkillCategory", {
  id: text().primaryKey(),
  name: text().notNull(),
  icon: text().notNull(),
  displayOrder: integer().notNull().default(0),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});

export const skill = sqliteTable(
  "Skill",
  {
    id: text().primaryKey(),
    categoryId: text().notNull(),
    name: text().notNull(),
    icon: text(),
    iconColor: text(),
    displayOrder: integer().notNull().default(0),
    createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime().notNull(),
  },
  (table) => [
    foreignKey({
      name: "Skill_categoryId_fkey",
      columns: [table.categoryId],
      foreignColumns: [skillCategory.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const user = sqliteTable("User", {
  id: text().primaryKey(),
  secret: text().notNull(),
  isRegistered: boolean().notNull().default(true),
  createdAt: datetime().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime().notNull(),
});
