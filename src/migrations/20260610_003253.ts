import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_articles_categorie" ADD VALUE 'insertion_pro';
  ALTER TYPE "public"."enum_articles_categorie" ADD VALUE 'orientation';
  ALTER TYPE "public"."enum_articles_categorie" ADD VALUE 'boite_outils';
  ALTER TYPE "public"."enum_articles_categorie" ADD VALUE 'bons_plans';
  ALTER TYPE "public"."enum_articles_statut" ADD VALUE 'planifie' BEFORE 'attente';
  CREATE TABLE "discussions_commentaires" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"auteur_id" integer NOT NULL,
  	"message" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "discussions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"contenu" varchar NOT NULL,
  	"auteur_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "direct_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_id" integer NOT NULL,
  	"to_id" integer NOT NULL,
  	"message" varchar,
  	"file_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "public_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"time" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles" ALTER COLUMN "contenu" SET DATA TYPE varchar;
  ALTER TABLE "articles" ALTER COLUMN "statut" SET DEFAULT 'brouillon';
  ALTER TABLE "alumni" ADD COLUMN "sub_google" varchar;
  ALTER TABLE "alumni" ADD COLUMN "sub_linkedin" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_public_id" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_url" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_resource_type" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_format" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_version" numeric;
  ALTER TABLE "media" ADD COLUMN "original_url" varchar;
  ALTER TABLE "media" ADD COLUMN "transformed_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "date_publication" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "piece_jointe_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "discussions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "direct_messages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "public_messages_id" integer;
  ALTER TABLE "discussions_commentaires" ADD CONSTRAINT "discussions_commentaires_auteur_id_alumni_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "discussions_commentaires" ADD CONSTRAINT "discussions_commentaires_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."discussions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "discussions" ADD CONSTRAINT "discussions_auteur_id_alumni_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_from_id_alumni_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_to_id_alumni_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "discussions_commentaires_order_idx" ON "discussions_commentaires" USING btree ("_order");
  CREATE INDEX "discussions_commentaires_parent_id_idx" ON "discussions_commentaires" USING btree ("_parent_id");
  CREATE INDEX "discussions_commentaires_auteur_idx" ON "discussions_commentaires" USING btree ("auteur_id");
  CREATE INDEX "discussions_auteur_idx" ON "discussions" USING btree ("auteur_id");
  CREATE INDEX "discussions_updated_at_idx" ON "discussions" USING btree ("updated_at");
  CREATE INDEX "discussions_created_at_idx" ON "discussions" USING btree ("created_at");
  CREATE INDEX "direct_messages_from_idx" ON "direct_messages" USING btree ("from_id");
  CREATE INDEX "direct_messages_to_idx" ON "direct_messages" USING btree ("to_id");
  CREATE INDEX "direct_messages_file_idx" ON "direct_messages" USING btree ("file_id");
  CREATE INDEX "direct_messages_updated_at_idx" ON "direct_messages" USING btree ("updated_at");
  CREATE INDEX "direct_messages_created_at_idx" ON "direct_messages" USING btree ("created_at");
  CREATE INDEX "public_messages_updated_at_idx" ON "public_messages" USING btree ("updated_at");
  CREATE INDEX "public_messages_created_at_idx" ON "public_messages" USING btree ("created_at");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_piece_jointe_id_media_id_fk" FOREIGN KEY ("piece_jointe_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discussions_fk" FOREIGN KEY ("discussions_id") REFERENCES "public"."discussions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_direct_messages_fk" FOREIGN KEY ("direct_messages_id") REFERENCES "public"."direct_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_public_messages_fk" FOREIGN KEY ("public_messages_id") REFERENCES "public"."public_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_piece_jointe_idx" ON "articles" USING btree ("piece_jointe_id");
  CREATE INDEX "payload_locked_documents_rels_discussions_id_idx" ON "payload_locked_documents_rels" USING btree ("discussions_id");
  CREATE INDEX "payload_locked_documents_rels_direct_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("direct_messages_id");
  CREATE INDEX "payload_locked_documents_rels_public_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("public_messages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "discussions_commentaires" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "discussions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "direct_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "public_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "discussions_commentaires" CASCADE;
  DROP TABLE "discussions" CASCADE;
  DROP TABLE "direct_messages" CASCADE;
  DROP TABLE "public_messages" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT "articles_piece_jointe_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_discussions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_direct_messages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_public_messages_fk";
  
  ALTER TABLE "articles" ALTER COLUMN "categorie" SET DATA TYPE text;
  DROP TYPE "public"."enum_articles_categorie";
  CREATE TYPE "public"."enum_articles_categorie" AS ENUM('vie_etablissement', 'portraits_anciens', 'international', 'evenements');
  ALTER TABLE "articles" ALTER COLUMN "categorie" SET DATA TYPE "public"."enum_articles_categorie" USING "categorie"::"public"."enum_articles_categorie";
  ALTER TABLE "articles" ALTER COLUMN "statut" SET DATA TYPE text;
  ALTER TABLE "articles" ALTER COLUMN "statut" SET DEFAULT 'publie'::text;
  DROP TYPE "public"."enum_articles_statut";
  CREATE TYPE "public"."enum_articles_statut" AS ENUM('publie', 'brouillon', 'attente');
  ALTER TABLE "articles" ALTER COLUMN "statut" SET DEFAULT 'publie'::"public"."enum_articles_statut";
  ALTER TABLE "articles" ALTER COLUMN "statut" SET DATA TYPE "public"."enum_articles_statut" USING "statut"::"public"."enum_articles_statut";
  DROP INDEX "articles_piece_jointe_idx";
  DROP INDEX "payload_locked_documents_rels_discussions_id_idx";
  DROP INDEX "payload_locked_documents_rels_direct_messages_id_idx";
  DROP INDEX "payload_locked_documents_rels_public_messages_id_idx";
  ALTER TABLE "articles" ALTER COLUMN "contenu" SET DATA TYPE jsonb;
  ALTER TABLE "alumni" DROP COLUMN "sub_google";
  ALTER TABLE "alumni" DROP COLUMN "sub_linkedin";
  ALTER TABLE "media" DROP COLUMN "cloudinary_public_id";
  ALTER TABLE "media" DROP COLUMN "cloudinary_url";
  ALTER TABLE "media" DROP COLUMN "cloudinary_resource_type";
  ALTER TABLE "media" DROP COLUMN "cloudinary_format";
  ALTER TABLE "media" DROP COLUMN "cloudinary_version";
  ALTER TABLE "media" DROP COLUMN "original_url";
  ALTER TABLE "media" DROP COLUMN "transformed_url";
  ALTER TABLE "articles" DROP COLUMN "date_publication";
  ALTER TABLE "articles" DROP COLUMN "piece_jointe_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "discussions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "direct_messages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "public_messages_id";`)
}
