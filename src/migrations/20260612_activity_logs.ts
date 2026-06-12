import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "group_activity_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "groupe_id" integer NOT NULL,
      "utilisateur_id" integer,
      "champ" varchar NOT NULL,
      "ancienne_valeur" varchar,
      "nouvelle_valeur" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "group_activity_logs_groupe_idx" ON "group_activity_logs" ("groupe_id");
    CREATE INDEX IF NOT EXISTS "group_activity_logs_utilisateur_idx" ON "group_activity_logs" ("utilisateur_id");
    CREATE INDEX IF NOT EXISTS "group_activity_logs_created_at_idx" ON "group_activity_logs" ("created_at");

    DO $$ BEGIN
      ALTER TABLE "group_activity_logs"
        ADD CONSTRAINT "group_activity_logs_groupe_id_groups_id_fk"
        FOREIGN KEY ("groupe_id") REFERENCES "groups"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "group_activity_logs"
        ADD CONSTRAINT "group_activity_logs_utilisateur_id_alumni_id_fk"
        FOREIGN KEY ("utilisateur_id") REFERENCES "alumni"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "group_activity_logs";
  `)
}
