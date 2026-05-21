import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offres_restreindre_promotions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_offres_restreindre_promotions";
  CREATE TYPE "public"."enum_offres_restreindre_promotions" AS ENUM('2026', '2027', '2028', '2029', '2030', '2031');
  ALTER TABLE "offres_restreindre_promotions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_offres_restreindre_promotions" USING "value"::"public"."enum_offres_restreindre_promotions";
  ALTER TABLE "offres" ALTER COLUMN "type_contrat" SET DATA TYPE text;
  DROP TYPE "public"."enum_offres_type_contrat";
  CREATE TYPE "public"."enum_offres_type_contrat" AS ENUM('CDI', 'CDD', 'Alternance', 'Stage', 'Independant');
  ALTER TABLE "offres" ALTER COLUMN "type_contrat" SET DATA TYPE "public"."enum_offres_type_contrat" USING "type_contrat"::"public"."enum_offres_type_contrat";
  ALTER TABLE "offres" ALTER COLUMN "statut" SET DATA TYPE text;
  ALTER TABLE "offres" ALTER COLUMN "statut" SET DEFAULT 'publie'::text;
  DROP TYPE "public"."enum_offres_statut";
  CREATE TYPE "public"."enum_offres_statut" AS ENUM('publie', 'brouillon');
  ALTER TABLE "offres" ALTER COLUMN "statut" SET DEFAULT 'publie'::"public"."enum_offres_statut";
  ALTER TABLE "offres" ALTER COLUMN "statut" SET DATA TYPE "public"."enum_offres_statut" USING "statut"::"public"."enum_offres_statut";
  ALTER TABLE "offres" ALTER COLUMN "localisation" SET DEFAULT 'PARIS';
  ALTER TABLE "offres" ALTER COLUMN "localisation" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "secteur" SET DATA TYPE varchar;
  ALTER TABLE "offres" ALTER COLUMN "secteur" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "remuneration" SET DATA TYPE varchar;
  ALTER TABLE "offres" ALTER COLUMN "remuneration" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "experience" SET DATA TYPE varchar;
  ALTER TABLE "offres" ALTER COLUMN "experience" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "date_debut" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "date_limite" DROP NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "description" DROP NOT NULL;
  DROP TYPE "public"."enum_offres_secteur";
  DROP TYPE "public"."enum_offres_remuneration";
  DROP TYPE "public"."enum_offres_experience";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_offres_secteur" AS ENUM('autres', 'compta', 'rh', 'informatique', 'commerce', 'agro_alimentaire', 'architecture', 'association_non_lucrative', 'banque_assurance_finance', 'conseil_audit', 'culture_media_divertissement', 'digital_technologie', 'grande_distribution_ventes', 'droit_ecogestion_science_politique', 'enseignement_formation_recrutement', 'entrepreneuriat_startup', 'travaux_publics', 'industrie', 'publicite_marketing_communication', 'mode_luxe_beaute', 'environnement_sante_social', 'sciences_recherche', 'secteur_public_administration', 'automobile', 'organisation_internationale', 'tourisme_hotellerie_restauration');
  CREATE TYPE "public"."enum_offres_remuneration" AS ENUM('non_renseigne', 'stage_non_indemnise', 'stage_indemnise', 'moins_15k', '20_225k', '25_275k', '30_325k', '35-37,5K €', '40_45k', '45_50k', '50_55k', '60_65k', '70_75k');
  CREATE TYPE "public"."enum_offres_experience" AS ENUM('non_renseigne', '0_2_ans', '2_4_ans', '4_7_ans', '7_10_ans', 'plus_10_ans');
  ALTER TYPE "public"."enum_offres_statut" ADD VALUE 'attente';
  ALTER TABLE "offres_restreindre_promotions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_offres_restreindre_promotions";
  CREATE TYPE "public"."enum_offres_restreindre_promotions" AS ENUM('2031', '2030', '2029', '2028', '2027', '2026');
  ALTER TABLE "offres_restreindre_promotions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_offres_restreindre_promotions" USING "value"::"public"."enum_offres_restreindre_promotions";
  ALTER TABLE "offres" ALTER COLUMN "type_contrat" SET DATA TYPE text;
  DROP TYPE "public"."enum_offres_type_contrat";
  CREATE TYPE "public"."enum_offres_type_contrat" AS ENUM('Stage', 'Alternance', 'Independant', 'Interim', 'CDD', 'CDI', 'VIA_VIE', 'Fonctionnaire', 'Benevole', 'Service_Civique', 'Dirigeant', 'Autre', 'CDDU');
  ALTER TABLE "offres" ALTER COLUMN "type_contrat" SET DATA TYPE "public"."enum_offres_type_contrat" USING "type_contrat"::"public"."enum_offres_type_contrat";
  ALTER TABLE "offres" ALTER COLUMN "localisation" DROP DEFAULT;
  ALTER TABLE "offres" ALTER COLUMN "localisation" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "secteur" SET DATA TYPE "public"."enum_offres_secteur" USING "secteur"::"public"."enum_offres_secteur";
  ALTER TABLE "offres" ALTER COLUMN "secteur" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "remuneration" SET DATA TYPE "public"."enum_offres_remuneration" USING "remuneration"::"public"."enum_offres_remuneration";
  ALTER TABLE "offres" ALTER COLUMN "remuneration" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "experience" SET DATA TYPE "public"."enum_offres_experience" USING "experience"::"public"."enum_offres_experience";
  ALTER TABLE "offres" ALTER COLUMN "experience" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "date_debut" SET NOT NULL;
  ALTER TABLE "offres" ALTER COLUMN "date_limite" SET NOT NULL;`)
}
