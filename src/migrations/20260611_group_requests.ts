import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Enum statut des demandes
    CREATE TYPE "public"."enum_group_requests_statut" AS ENUM('pending', 'accepted', 'rejected');

    -- Table des demandes d'accès
    CREATE TABLE IF NOT EXISTS "group_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "groupe_id" integer NOT NULL,
      "demandeur_id" integer NOT NULL,
      "statut" "public"."enum_group_requests_statut" NOT NULL DEFAULT 'pending',
      "message" varchar,
      "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
      "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
    );

    -- Index
    CREATE INDEX IF NOT EXISTS "group_requests_groupe_idx" ON "group_requests" ("groupe_id");
    CREATE INDEX IF NOT EXISTS "group_requests_demandeur_idx" ON "group_requests" ("demandeur_id");
    CREATE INDEX IF NOT EXISTS "group_requests_statut_idx" ON "group_requests" ("statut");
    CREATE INDEX IF NOT EXISTS "group_requests_updated_at_idx" ON "group_requests" ("updated_at");
    CREATE INDEX IF NOT EXISTS "group_requests_created_at_idx" ON "group_requests" ("created_at");

    -- Clés étrangères
    ALTER TABLE "group_requests"
      ADD CONSTRAINT "group_requests_groupe_id_groups_id_fk"
      FOREIGN KEY ("groupe_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "group_requests"
      ADD CONSTRAINT "group_requests_demandeur_id_alumni_id_fk"
      FOREIGN KEY ("demandeur_id") REFERENCES "alumni"("id") ON DELETE cascade ON UPDATE no action;

    -- Champ admins sur la table groups (table de relation)
    CREATE TABLE IF NOT EXISTS "groups_admins" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" integer,
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "groups_admins_order_idx" ON "groups_admins" ("order");
    CREATE INDEX IF NOT EXISTS "groups_admins_parent_idx" ON "groups_admins" ("parent_id");

    ALTER TABLE "groups_admins"
      ADD CONSTRAINT "groups_admins_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "groups_admins"
      ADD CONSTRAINT "groups_admins_value_alumni_id_fk"
      FOREIGN KEY ("value") REFERENCES "alumni"("id") ON DELETE set null ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "groups_admins";
    DROP TABLE IF EXISTS "group_requests";
    DROP TYPE IF EXISTS "public"."enum_group_requests_statut";
  `)
}