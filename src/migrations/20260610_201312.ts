import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_alumni_civilite" AS ENUM('M.', 'Mme');
  CREATE TYPE "public"."enum_alumni_secteur" AS ENUM('it', 'finance', 'commerce', 'assurance', 'tourisme', 'autre');
  CREATE TYPE "public"."enum_alumni_search_opportunities" AS ENUM('not_looking', 'searching', 'listening');
  CREATE TYPE "public"."enum_alumni_mentorat_role" AS ENUM('mentor', 'filleul');
  ALTER TABLE "alumni_formations" ADD COLUMN "campus" varchar;
  ALTER TABLE "alumni" ADD COLUMN "last_seen" timestamp(3) with time zone;
  ALTER TABLE "alumni" ADD COLUMN "civilite" "enum_alumni_civilite";
  ALTER TABLE "alumni" ADD COLUMN "date_naissance" timestamp(3) with time zone;
  ALTER TABLE "alumni" ADD COLUMN "secteur" "enum_alumni_secteur";
  ALTER TABLE "alumni" ADD COLUMN "search_opportunities" "enum_alumni_search_opportunities" DEFAULT 'not_looking';
  ALTER TABLE "alumni" ADD COLUMN "mentorat_active" boolean DEFAULT false;
  ALTER TABLE "alumni" ADD COLUMN "mentorat_role" "enum_alumni_mentorat_role" DEFAULT 'filleul';
  ALTER TABLE "media" DROP COLUMN "cloudinary_public_id";
  ALTER TABLE "media" DROP COLUMN "cloudinary_url";
  ALTER TABLE "media" DROP COLUMN "cloudinary_resource_type";
  ALTER TABLE "media" DROP COLUMN "cloudinary_format";
  ALTER TABLE "media" DROP COLUMN "cloudinary_version";
  ALTER TABLE "media" DROP COLUMN "original_url";
  ALTER TABLE "media" DROP COLUMN "transformed_url";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "cloudinary_public_id" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_url" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_resource_type" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_format" varchar;
  ALTER TABLE "media" ADD COLUMN "cloudinary_version" numeric;
  ALTER TABLE "media" ADD COLUMN "original_url" varchar;
  ALTER TABLE "media" ADD COLUMN "transformed_url" varchar;
  ALTER TABLE "alumni_formations" DROP COLUMN "campus";
  ALTER TABLE "alumni" DROP COLUMN "last_seen";
  ALTER TABLE "alumni" DROP COLUMN "civilite";
  ALTER TABLE "alumni" DROP COLUMN "date_naissance";
  ALTER TABLE "alumni" DROP COLUMN "secteur";
  ALTER TABLE "alumni" DROP COLUMN "search_opportunities";
  ALTER TABLE "alumni" DROP COLUMN "mentorat_active";
  ALTER TABLE "alumni" DROP COLUMN "mentorat_role";
  DROP TYPE "public"."enum_alumni_civilite";
  DROP TYPE "public"."enum_alumni_secteur";
  DROP TYPE "public"."enum_alumni_search_opportunities";
  DROP TYPE "public"."enum_alumni_mentorat_role";`)
}
