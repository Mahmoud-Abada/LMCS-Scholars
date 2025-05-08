CREATE TYPE "public"."classification_system_type" AS ENUM('CORE', 'Scimago', 'DGRSDT', 'Qualis', 'JCR', 'SJR', 'other');--> statement-breakpoint
CREATE TYPE "public"."publication_type" AS ENUM('journal_article', 'conference_paper', 'book_chapter', 'patent', 'technical_report', 'thesis', 'preprint');--> statement-breakpoint
CREATE TYPE "public"."research_position" AS ENUM('director', 'department_head', 'principal_investigator', 'senior_researcher', 'researcher', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."qualification" AS ENUM('professor', 'associate_professor', 'assistant_professor', 'postdoc', 'phd_candidate', 'research_scientist');--> statement-breakpoint
CREATE TYPE "public"."researcher_status" AS ENUM('active', 'on_leave', 'inactive', 'retired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'director', 'researcher', 'assistant', 'guest');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('journal', 'conference', 'workshop', 'symposium', 'book');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" uuid NOT NULL,
	"type" varchar(512) NOT NULL,
	"provider" varchar(512) NOT NULL,
	"provider_account_id" varchar(512) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(512),
	"scope" varchar(512),
	"id_token" text,
	"session_state" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(50),
	"user_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classification_system" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "classification_system_type" NOT NULL,
	"description" text,
	"website" varchar(512),
	"current_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_author" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"affiliation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_token" (
	"identifier" varchar(512) NOT NULL,
	"token" varchar(512) NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "publication_author" (
	"publication_id" uuid NOT NULL,
	"researcher_id" uuid NOT NULL,
	"affiliation_during_work" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publication_author_publication_id_researcher_id_pk" PRIMARY KEY("publication_id","researcher_id")
);
--> statement-breakpoint
CREATE TABLE "publication_classification" (
	"publication_id" uuid NOT NULL,
	"system_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"year" integer NOT NULL,
	"evidence_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publication_classification_publication_id_system_id_year_pk" PRIMARY KEY("publication_id","system_id","year")
);
--> statement-breakpoint
CREATE TABLE "publication_external_author" (
	"publication_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publication_external_author_publication_id_author_id_pk" PRIMARY KEY("publication_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "publication_venue" (
	"publication_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"pages" varchar(50),
	"volume" varchar(50),
	"issue" varchar(50),
	"event_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "publication_venue_publication_id_venue_id_pk" PRIMARY KEY("publication_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "publication" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"authors" text[],
	"publication_type" "publication_type",
	"publication_date" date,
	"doi" varchar(250),
	"url" varchar(512),
	"pdf_url" varchar(512),
	"scholar_link" varchar(512),
	"dblp_link" varchar(512),
	"citation_count" integer DEFAULT 0,
	"pages" varchar(50),
	"volume" varchar(50),
	"issue" varchar(50),
	"publisher" varchar(512),
	"journal" varchar(512),
	"language" varchar(50) DEFAULT 'English',
	"citation_graph" jsonb,
	"google_scholar_articles" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"established_date" date,
	"website_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "researcher" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orcid_id" varchar(30),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(512) NOT NULL,
	"phone" varchar(20),
	"status" "researcher_status" DEFAULT 'active',
	"qualification" "qualification",
	"position" "research_position",
	"h_index" integer DEFAULT 0,
	"i10_index" integer DEFAULT 0,
	"citations" integer DEFAULT 0,
	"team_id" uuid,
	"join_date" date,
	"leave_date" date,
	"biography" text,
	"research_interests" text,
	"dblp_url" varchar(512),
	"google_scholar_url" varchar(512),
	"research_gate_url" varchar(512),
	"linkedin_url" varchar(512),
	"personal_website" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "researcher_orcid_id_unique" UNIQUE("orcid_id"),
	CONSTRAINT "researcher_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(512) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(512),
	"email" varchar(512) NOT NULL,
	"email_verified" timestamp,
	"image" varchar(512),
	"password" varchar(512),
	"role" "user_role" DEFAULT 'researcher' NOT NULL,
	"researcher_id" uuid,
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(512) NOT NULL,
	"type" "venue_type" NOT NULL,
	"publisher" varchar(512),
	"issn" varchar(20),
	"eissn" varchar(20),
	"sjr_indicator" numeric(6, 3),
	"is_open_access" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" varchar(512) NOT NULL,
	"token" varchar(512) NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_author" ADD CONSTRAINT "publication_author_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_author" ADD CONSTRAINT "publication_author_researcher_id_researcher_id_fk" FOREIGN KEY ("researcher_id") REFERENCES "public"."researcher"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_classification" ADD CONSTRAINT "publication_classification_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_classification" ADD CONSTRAINT "publication_classification_system_id_classification_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."classification_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_external_author" ADD CONSTRAINT "publication_external_author_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_external_author" ADD CONSTRAINT "publication_external_author_author_id_external_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."external_author"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_venue" ADD CONSTRAINT "publication_venue_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_venue" ADD CONSTRAINT "publication_venue_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "researcher" ADD CONSTRAINT "researcher_team_id_research_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."research_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_researcher_id_researcher_id_fk" FOREIGN KEY ("researcher_id") REFERENCES "public"."researcher"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pub_author_idx" ON "publication_author" USING btree ("publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ext_author_position_idx" ON "publication_external_author" USING btree ("publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publication_scholar_link_idx" ON "publication" USING btree ("scholar_link");--> statement-breakpoint
CREATE UNIQUE INDEX "team_name_idx" ON "research_team" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "researcher_email_idx" ON "researcher" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "researcher_orcid_idx" ON "researcher" USING btree ("orcid_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "session" USING btree ("session_token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_researcher_idx" ON "user" USING btree ("researcher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venue_name_type_idx" ON "venue" USING btree ("name","type");