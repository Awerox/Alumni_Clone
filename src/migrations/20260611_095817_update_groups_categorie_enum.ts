import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "groups" ALTER COLUMN "categorie" SET DATA TYPE text;
  DROP TYPE "public"."enum_groups_categorie";
  CREATE TYPE "public"."enum_groups_categorie" AS ENUM('academique', 'culturel', 'artistique', 'sportif', 'environnement', 'solidarite', 'professionnel', 'loisir', 'autre');
  ALTER TABLE "groups" ALTER COLUMN "categorie" SET DATA TYPE "public"."enum_groups_categorie" USING "categorie"::"public"."enum_groups_categorie";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "groups" ALTER COLUMN "categorie" SET DATA TYPE text;
  DROP TYPE "public"."enum_groups_categorie";
  CREATE TYPE "public"."enum_groups_categorie" AS ENUM('bts_sio', 'entrepreneuriat', 'vie_etudiante', 'entraide');
  ALTER TABLE "groups" ALTER COLUMN "categorie" SET DATA TYPE "public"."enum_groups_categorie" USING "categorie"::"public"."enum_groups_categorie";`)
}
