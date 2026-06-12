import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Ajoute 'removed' à l'enum de statut (PG12+, fonctionne dans une transaction)
    ALTER TYPE "public"."enum_group_requests_statut" ADD VALUE IF NOT EXISTS 'removed';

    -- Ajoute la colonne motif (raison du refus ou du retrait)
    ALTER TABLE "group_requests" ADD COLUMN IF NOT EXISTS "motif" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "group_requests" DROP COLUMN IF EXISTS "motif";
    -- Note: PostgreSQL ne permet pas de retirer une valeur d'un enum facilement, no-op
  `)
}