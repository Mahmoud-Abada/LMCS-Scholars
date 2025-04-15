CREATE TYPE "public"."classification_system_enum" AS ENUM('CORE', 'Scimago', 'DGRSDT', 'Qualis', 'other');--> statement-breakpoint
CREATE TYPE "public"."publication_type" AS ENUM('journal', 'conference', 'chapter', 'patent', 'other');--> statement-breakpoint
CREATE TYPE "public"."research_grade" AS ENUM('research_assistant', 'research_associate', 'research_director', 'none');--> statement-breakpoint
CREATE TYPE "public"."qualification" AS ENUM('teacher_researcher', 'researcher', 'phd_student');--> statement-breakpoint
CREATE TYPE "public"."researcher_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'director', 'researcher', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('conference', 'journal', 'workshop');--> statement-breakpoint
CREATE TABLE "classification_system" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" "classification_system_enum" NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "publication_classification" (
	"publication_id" varchar(50) NOT NULL,
	"system_id" varchar(50) NOT NULL,
	"rank" varchar(10) NOT NULL,
	"evidence_url" varchar(512),
	CONSTRAINT "publication_classification_publication_id_system_id_pk" PRIMARY KEY("publication_id","system_id")
);
--> statement-breakpoint
CREATE TABLE "publication_venue" (
	"publication_id" varchar(50) NOT NULL,
	"venue_id" varchar(50) NOT NULL,
	CONSTRAINT "publication_venue_publication_id_venue_id_pk" PRIMARY KEY("publication_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "publication" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"researcher_id" varchar(36) NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"page_count" integer,
	"volume" varchar(50),
	"doi" varchar(100),
	"url" varchar(512),
	"year" integer NOT NULL,
	"type" "publication_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "researcher" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"diploma" varchar(100),
	"origin_institution" varchar(255),
	"qualification" "qualification" NOT NULL,
	"grade" "research_grade",
	"status" "researcher_status" DEFAULT 'active',
	"h_index" integer DEFAULT 0,
	"team" varchar(100) NOT NULL,
	"dblp_url" varchar(512),
	"google_scholar_url" varchar(512),
	"research_gate_url" varchar(512),
	"personal_website" varchar(512),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "researcher_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(20),
	"researcher_id" varchar(36),
	"role" "user_role" DEFAULT 'researcher' NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "venue_type" NOT NULL,
	"theme" varchar(100),
	"scope" varchar(100),
	"location" varchar(255),
	"start_date" date,
	"end_date" date,
	"periodicity" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "publication_classification" ADD CONSTRAINT "publication_classification_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_classification" ADD CONSTRAINT "publication_classification_system_id_classification_system_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."classification_system"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_venue" ADD CONSTRAINT "publication_venue_publication_id_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publication"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication_venue" ADD CONSTRAINT "publication_venue_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publication" ADD CONSTRAINT "publication_researcher_id_researcher_id_fk" FOREIGN KEY ("researcher_id") REFERENCES "public"."researcher"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_researcher_id_researcher_id_fk" FOREIGN KEY ("researcher_id") REFERENCES "public"."researcher"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_researcher_idx" ON "user" USING btree ("researcher_id");