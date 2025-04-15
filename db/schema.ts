// src/db/schema.ts
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ---- Enums ----
export const researcherStatusEnum = pgEnum("researcher_status", [
  "active",
  "inactive",
]);
export const researcherQualificationEnum = pgEnum("qualification", [
  "teacher_researcher",
  "researcher",
  "phd_student",
]);
export const researcherGradeEnum = pgEnum("research_grade", [
  "research_assistant",
  "research_associate",
  "research_director",
  "none",
]);
export const publicationTypeEnum = pgEnum("publication_type", [
  "journal",
  "conference",
  "chapter",
  "patent",
  "other",
]);
export const venueTypeEnum = pgEnum("venue_type", [
  "conference",
  "journal",
  "workshop",
]);
export const classificationSystemEnum = pgEnum("classification_system_enum", [
  "CORE",
  "Scimago",
  "DGRSDT",
  "Qualis",
  "other",
]);
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "director",
  "researcher",
  "assistant",
]);

// ---- Tables ----
export const researchers = pgTable("researcher", {
  id: varchar("id", { length: 36 }).primaryKey(), // ESI Matricule
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  diploma: varchar("diploma", { length: 100 }),
  originInstitution: varchar("origin_institution", { length: 255 }),
  qualification: researcherQualificationEnum("qualification").notNull(),
  grade: researcherGradeEnum("grade"),
  status: researcherStatusEnum("status").default("active"),
  hIndex: integer("h_index").default(0),
  team: varchar("team", { length: 100 }).notNull(),
  dblpUrl: varchar("dblp_url", { length: 512 }),
  googleScholarUrl: varchar("google_scholar_url", { length: 512 }),
  researchGateUrl: varchar("research_gate_url", { length: 512 }),
  personalWebsite: varchar("personal_website", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const publications = pgTable("publication", {
  id: varchar("id", { length: 50 }).primaryKey(), // Acronym
  researcherId: varchar("researcher_id", { length: 36 })
    .notNull()
    .references(() => researchers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  abstract: text("abstract"),
  pageCount: integer("page_count"),
  volume: varchar("volume", { length: 50 }),
  doi: varchar("doi", { length: 100 }),
  url: varchar("url", { length: 512 }),
  year: integer("year").notNull(),
  type: publicationTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venues = pgTable("venue", {
  id: varchar("id", { length: 50 }).primaryKey(), // Acronym
  name: varchar("name", { length: 255 }).notNull(),
  type: venueTypeEnum("type").notNull(),
  theme: varchar("theme", { length: 100 }),
  scope: varchar("scope", { length: 100 }),
  location: varchar("location", { length: 255 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  periodicity: varchar("periodicity", { length: 50 }),
});

export const publicationVenues = pgTable(
  "publication_venue",
  {
    publicationId: varchar("publication_id", { length: 50 })
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    venueId: varchar("venue_id", { length: 50 })
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey(t.publicationId, t.venueId),
  })
);

export const classificationSystems = pgTable("classification_system", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: classificationSystemEnum("name").notNull(),
  description: text("description"),
});

export const publicationClassifications = pgTable(
  "publication_classification",
  {
    publicationId: varchar("publication_id", { length: 50 })
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    systemId: varchar("system_id", { length: 50 })
      .notNull()
      .references(() => classificationSystems.id, { onDelete: "cascade" }),
    rank: varchar("rank", { length: 10 }).notNull(), // 'A', 'B', 'Q1', etc.
    evidenceUrl: varchar("evidence_url", { length: 512 }),
  },
  (t) => ({
    pk: primaryKey(t.publicationId, t.systemId),
  })
);


export const users = pgTable(
  "user",
  {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: varchar("image", { length: 255 }),
    password: varchar("password", { length: 255 }),
    role: userRoleEnum("role").notNull().default("researcher"),
    researcherId: varchar("researcher_id", { length: 36 }).references(
      () => researchers.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    researcherIdx: uniqueIndex("user_researcher_idx").on(table.researcherId),
  })
);

export const accounts = pgTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  })
);


// src/db/schema.ts
// Add this if you have multiple authors per publication
export const publicationAuthors = pgTable(
  'publication_author',
  {
    publicationId: varchar('publication_id', { length: 50 })
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    researcherId: varchar('researcher_id', { length: 36 })
      .notNull()
      .references(() => researchers.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    pk: primaryKey(t.publicationId, t.researcherId)
  })
);