import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "group_requests" ADD COLUMN IF NOT EXISTS "moderateur_id" integer;

    DO $$ BEGIN
      ALTER TABLE "group_requests"
        ADD CONSTRAINT "group_requests_moderateur_id_alumni_id_fk"
        FOREIGN KEY ("moderateur_id") REFERENCES "alumni"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "group_requests_moderateur_idx" ON "group_requests" ("moderateur_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "group_requests" DROP COLUMN IF EXISTS "moderateur_id";
  `)
}