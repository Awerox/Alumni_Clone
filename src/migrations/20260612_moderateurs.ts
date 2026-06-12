import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Supprime les anciennes tables si elles existent
    DROP TABLE IF EXISTS "groups_admins";
    DROP TABLE IF EXISTS "groups_admins_config";

    -- Table pour le champ array "moderateurs"
    CREATE TABLE IF NOT EXISTS "groups_moderateurs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "membre_id" integer NOT NULL,
      "can_manage_requests" boolean DEFAULT false,
      "can_manage_members" boolean DEFAULT false,
      "can_edit_group" boolean DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS "groups_moderateurs_order_idx" ON "groups_moderateurs" ("_order");
    CREATE INDEX IF NOT EXISTS "groups_moderateurs_parent_idx" ON "groups_moderateurs" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "groups_moderateurs_membre_idx" ON "groups_moderateurs" ("membre_id");

    ALTER TABLE "groups_moderateurs"
      ADD CONSTRAINT "groups_moderateurs_parent_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "groups_moderateurs"
      ADD CONSTRAINT "groups_moderateurs_membre_alumni_id_fk"
      FOREIGN KEY ("membre_id") REFERENCES "alumni"("id") ON DELETE cascade ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "groups_moderateurs";
  `)
}
