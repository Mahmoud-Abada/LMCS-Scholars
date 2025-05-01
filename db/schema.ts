// src/db/schema.ts
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ======================
// ==== ENUMERATIONS ====
// ======================

export const researcherStatusEnum = pgEnum("researcher_status", [
  "active",
  "on_leave",
  "inactive",
  "retired",
]);

export const researcherQualificationEnum = pgEnum("qualification", [
  "professor",
  "associate_professor",
  "assistant_professor",
  "postdoc",
  "phd_candidate",
  "research_scientist",
]);

export const researcherPositionEnum = pgEnum("research_position", [
  "director",
  "department_head",
  "principal_investigator",
  "senior_researcher",
  "researcher",
  "assistant",
]);

export const publicationTypeEnum = pgEnum("publication_type", [
  "journal_article",
  "conference_paper",
  "book_chapter",
  "patent",
  "technical_report",
  "thesis",
  "preprint",
]);

export const venueTypeEnum = pgEnum("venue_type", [
  "journal",
  "conference",
  "workshop",
  "symposium",
  "book",
]);


export const classificationSystemEnum = pgEnum("classification_system_type", [
  "CORE",
  "Scimago",
  "DGRSDT",
  "Qualis",
  "JCR",
  "SJR",
  "other",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "director",
  "researcher",
  "assistant",
  "guest",
]);

// =================
// ==== TABLES ====
// =================

// ---- Research Teams ----
export const researchTeams = pgTable(
  "research_team",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    establishedDate: date("established_date"),
    websiteUrl: varchar("website_url", { length: 512 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex("team_name_idx").on(table.name),
  })
);

// ---- Researchers ----
export const researchers = pgTable(
  "researcher",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orcidId: varchar("orcid_id", { length: 19 }).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 512 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    status: researcherStatusEnum("status").default("active"),
    qualification: researcherQualificationEnum("qualification"),
    position: researcherPositionEnum("position"),
    hIndex: integer("h_index").default(0),
    i10Index: integer("i10_index").default(0),
    citations: integer("citations").default(0),
    teamId: uuid("team_id").references(() => researchTeams.id, {
      onDelete: "set null",
    }),
    joinDate: date("join_date"),
    leaveDate: date("leave_date"),
    biography: text("biography"),
    researchInterests: text("research_interests"),
    dblpUrl: varchar("dblp_url", { length: 512 }),
    googleScholarUrl: varchar("google_scholar_url", { length: 512 }),
    researchGateUrl: varchar("research_gate_url", { length: 512 }),
    linkedinUrl: varchar("linkedin_url", { length: 512 }),
    personalWebsite: varchar("personal_website", { length: 512 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("researcher_email_idx").on(table.email),
    orcidIdx: uniqueIndex("researcher_orcid_idx").on(table.orcidId),
  })
);

// ---- Publications ----

export const publications = pgTable(
  "publication",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    abstract: text("abstract"),
    authors: text("authors").array(), // Added for raw author names
    publicationType: publicationTypeEnum("publication_type"),
    publicationDate: date("publication_date"),
    doi: varchar("doi", { length: 250 }),
    url: varchar("url", { length: 512 }),
    pdfUrl: varchar("pdf_url", { length: 512 }),
    scholarLink: varchar("scholar_link", { length: 512 }),
    dblpLink: varchar("dblp_link", { length: 512 }),
    citationCount: integer("citation_count").default(0),
    pages: varchar("pages", { length: 50 }),
    volume: varchar("volume", { length: 50 }),
    issue: varchar("issue", { length: 50 }),
    publisher: varchar("publisher", { length: 512 }),
    journal: varchar("journal", { length: 512 }), // Added
    language: varchar("language", { length: 50 }).default("English"),
    citationGraph: jsonb("citation_graph"),
    googleScholarArticles: jsonb("google_scholar_articles"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    scholarLinkIdx: uniqueIndex("publication_scholar_link_idx").on(table.scholarLink),
  })
);

export const externalAuthors = pgTable("external_author", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  affiliation: text("affiliation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const publicationExternalAuthors = pgTable(
  "publication_external_author",
  {
    publicationId: uuid("publication_id")
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => externalAuthors.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.publicationId, table.authorId] }),
    positionIdx: uniqueIndex("ext_author_position_idx").on(
      table.publicationId,
    ),
  })
);

// ---- Publication Authors ----
export const publicationAuthors = pgTable(
  "publication_author",
  {
    publicationId: uuid("publication_id")
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    researcherId: uuid("researcher_id")
      .notNull()
      .references(() => researchers.id, { onDelete: "cascade" }),
    affiliationDuringWork: text("affiliation_during_work"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.publicationId, table.researcherId] }),
    pubAuthorIdx: uniqueIndex("pub_author_idx").on(
      table.publicationId
    ),
  })
);

// ---- Venues ----
export const venues = pgTable(
  "venue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 512 }).notNull(),
    type: venueTypeEnum("type").notNull(),
    publisher: varchar("publisher", { length: 512 }),
    issn: varchar("issn", { length: 20 }),
    eissn: varchar("eissn", { length: 20 }),
    sjrIndicator: numeric("sjr_indicator", { precision: 6, scale: 3 }),
    isOpenAccess: boolean("is_open_access").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameTypeIdx: uniqueIndex("venue_name_type_idx").on(table.name, table.type),
  })
);

// ---- Publication Venues ----
export const publicationVenues = pgTable(
  "publication_venue",
  {
    publicationId: uuid("publication_id")
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    pages: varchar("pages", { length: 50 }),
    volume: varchar("volume", { length: 50 }),
    issue: varchar("issue", { length: 50 }),
    eventDate: date("event_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.publicationId, table.venueId] }),
  })
);

// ---- Classification Systems ----
export const classificationSystems = pgTable("classification_system", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: classificationSystemEnum("name").notNull(),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  currentYear: integer("current_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---- Publication Classifications ----
export const publicationClassifications = pgTable(
  "publication_classification",
  {
    publicationId: uuid("publication_id")
      .notNull()
      .references(() => publications.id, { onDelete: "cascade" }),
    systemId: uuid("system_id")
      .notNull()
      .references(() => classificationSystems.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(), // 'Q1', 'A', etc.
    year: integer("year").notNull(),
    evidenceUrl: varchar("evidence_url", { length: 512 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.publicationId, table.systemId, table.year],
    }),
  })
);



// ========================
// ==== AUTHENTICATION ====
// ========================

// ---- Users ----
export const users = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 512 }),
    email: varchar("email", { length: 512 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: varchar("image", { length: 512 }),
    password: varchar("password", { length: 512 }),
    role: userRoleEnum("role").notNull().default("researcher"),
    researcherId: uuid("researcher_id").references(() => researchers.id, {
      onDelete: "set null",
    }),
    lastLogin: timestamp("last_login"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
    researcherIdx: uniqueIndex("user_researcher_idx").on(table.researcherId),
  })
);

// ---- Accounts ----
export const accounts = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 512 }).notNull(),
    provider: varchar("provider", { length: 512 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 512,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 512 }),
    scope: varchar("scope", { length: 512 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 512 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
);

// ---- Sessions ----
export const sessions = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionToken: varchar("session_token", { length: 512 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex("session_token_idx").on(table.sessionToken),
  })
);

// ---- Verification Tokens ----
export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 512 }).notNull(),
    token: varchar("token", { length: 512 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ---- Password Reset Tokens ----
export const passwordResetTokens = pgTable(
  "password_reset_token",
  {
    identifier: varchar("identifier", { length: 512 }).notNull(),
    token: varchar("token", { length: 512 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ---- Audit Log ----
export const auditLogs = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 50 }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
