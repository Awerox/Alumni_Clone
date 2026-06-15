import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_group_requests_statut" AS ENUM('pending', 'accepted', 'rejected', 'removed');
  CREATE TYPE "public"."enum_group_posts_type" AS ENUM('post', 'annonce', 'evenement');
  CREATE TABLE "groups_moderateurs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"membre_id" integer NOT NULL,
  	"can_manage_requests" boolean DEFAULT false,
  	"can_manage_members" boolean DEFAULT false,
  	"can_edit_group" boolean DEFAULT false
  );
  
  CREATE TABLE "group_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"groupe_id" integer NOT NULL,
  	"demandeur_id" integer NOT NULL,
  	"statut" "enum_group_requests_statut" DEFAULT 'pending' NOT NULL,
  	"message" varchar,
  	"motif" varchar,
  	"moderateur_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "group_activity_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"groupe_id" integer NOT NULL,
  	"utilisateur_id" integer,
  	"champ" varchar NOT NULL,
  	"ancienne_valeur" varchar,
  	"nouvelle_valeur" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "group_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_id" integer NOT NULL,
  	"author_id" integer NOT NULL,
  	"content" varchar,
  	"image_id" integer,
  	"type" "enum_group_posts_type" DEFAULT 'post',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "group_requests_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "group_activity_logs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "group_posts_id" integer;
  ALTER TABLE "groups_moderateurs" ADD CONSTRAINT "groups_moderateurs_membre_id_alumni_id_fk" FOREIGN KEY ("membre_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups_moderateurs" ADD CONSTRAINT "groups_moderateurs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "group_requests" ADD CONSTRAINT "group_requests_groupe_id_groups_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_requests" ADD CONSTRAINT "group_requests_demandeur_id_alumni_id_fk" FOREIGN KEY ("demandeur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_requests" ADD CONSTRAINT "group_requests_moderateur_id_alumni_id_fk" FOREIGN KEY ("moderateur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_activity_logs" ADD CONSTRAINT "group_activity_logs_groupe_id_groups_id_fk" FOREIGN KEY ("groupe_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_activity_logs" ADD CONSTRAINT "group_activity_logs_utilisateur_id_alumni_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_author_id_alumni_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "groups_moderateurs_order_idx" ON "groups_moderateurs" USING btree ("_order");
  CREATE INDEX "groups_moderateurs_parent_id_idx" ON "groups_moderateurs" USING btree ("_parent_id");
  CREATE INDEX "groups_moderateurs_membre_idx" ON "groups_moderateurs" USING btree ("membre_id");
  CREATE INDEX "group_requests_groupe_idx" ON "group_requests" USING btree ("groupe_id");
  CREATE INDEX "group_requests_demandeur_idx" ON "group_requests" USING btree ("demandeur_id");
  CREATE INDEX "group_requests_moderateur_idx" ON "group_requests" USING btree ("moderateur_id");
  CREATE INDEX "group_requests_updated_at_idx" ON "group_requests" USING btree ("updated_at");
  CREATE INDEX "group_requests_created_at_idx" ON "group_requests" USING btree ("created_at");
  CREATE INDEX "group_activity_logs_groupe_idx" ON "group_activity_logs" USING btree ("groupe_id");
  CREATE INDEX "group_activity_logs_utilisateur_idx" ON "group_activity_logs" USING btree ("utilisateur_id");
  CREATE INDEX "group_activity_logs_updated_at_idx" ON "group_activity_logs" USING btree ("updated_at");
  CREATE INDEX "group_activity_logs_created_at_idx" ON "group_activity_logs" USING btree ("created_at");
  CREATE INDEX "group_posts_group_idx" ON "group_posts" USING btree ("group_id");
  CREATE INDEX "group_posts_author_idx" ON "group_posts" USING btree ("author_id");
  CREATE INDEX "group_posts_image_idx" ON "group_posts" USING btree ("image_id");
  CREATE INDEX "group_posts_updated_at_idx" ON "group_posts" USING btree ("updated_at");
  CREATE INDEX "group_posts_created_at_idx" ON "group_posts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_group_requests_fk" FOREIGN KEY ("group_requests_id") REFERENCES "public"."group_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_group_activity_logs_fk" FOREIGN KEY ("group_activity_logs_id") REFERENCES "public"."group_activity_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_group_posts_fk" FOREIGN KEY ("group_posts_id") REFERENCES "public"."group_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_group_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("group_requests_id");
  CREATE INDEX "payload_locked_documents_rels_group_activity_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("group_activity_logs_id");
  CREATE INDEX "payload_locked_documents_rels_group_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("group_posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "groups_moderateurs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_activity_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "group_posts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "groups_moderateurs" CASCADE;
  DROP TABLE "group_requests" CASCADE;
  DROP TABLE "group_activity_logs" CASCADE;
  DROP TABLE "group_posts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_group_requests_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_group_activity_logs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_group_posts_fk";
  
  DROP INDEX "payload_locked_documents_rels_group_requests_id_idx";
  DROP INDEX "payload_locked_documents_rels_group_activity_logs_id_idx";
  DROP INDEX "payload_locked_documents_rels_group_posts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "group_requests_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "group_activity_logs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "group_posts_id";
  DROP TYPE "public"."enum_group_requests_statut";
  DROP TYPE "public"."enum_group_posts_type";`)
}
