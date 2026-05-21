import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_alumni_statut" AS ENUM('etudiant', 'alumni');
  CREATE TYPE "public"."enum_jobs_type_contrat" AS ENUM('cdi', 'cdd', 'alternance', 'stage');
  CREATE TYPE "public"."enum_groups_categorie" AS ENUM('bts_sio', 'entrepreneuriat', 'vie_etudiante', 'entraide');
  CREATE TYPE "public"."enum_articles_categorie" AS ENUM('vie_etablissement', 'portraits_anciens', 'international', 'evenements');
  CREATE TYPE "public"."enum_articles_statut" AS ENUM('publie', 'brouillon', 'attente');
  CREATE TYPE "public"."enum_offres_restreindre_diplomes" AS ENUM('bts', 'dcg3', 'prepa');
  CREATE TYPE "public"."enum_offres_restreindre_campus" AS ENUM('enc_bessieres', 'enc_bessieres_apprentissage');
  CREATE TYPE "public"."enum_offres_restreindre_promotions" AS ENUM('2031', '2030', '2029', '2028', '2027', '2026');
  CREATE TYPE "public"."enum_offres_type_contrat" AS ENUM('Stage', 'Alternance', 'Independant', 'Interim', 'CDD', 'CDI', 'VIA_VIE', 'Fonctionnaire', 'Benevole', 'Service_Civique', 'Dirigeant', 'Autre', 'CDDU');
  CREATE TYPE "public"."enum_offres_secteur" AS ENUM('autres', 'compta', 'rh', 'informatique', 'commerce', 'agro_alimentaire', 'architecture', 'association_non_lucrative', 'banque_assurance_finance', 'conseil_audit', 'culture_media_divertissement', 'digital_technologie', 'grande_distribution_ventes', 'droit_ecogestion_science_politique', 'enseignement_formation_recrutement', 'entrepreneuriat_startup', 'travaux_publics', 'industrie', 'publicite_marketing_communication', 'mode_luxe_beaute', 'environnement_sante_social', 'sciences_recherche', 'secteur_public_administration', 'automobile', 'organisation_internationale', 'tourisme_hotellerie_restauration');
  CREATE TYPE "public"."enum_offres_remuneration" AS ENUM('non_renseigne', 'stage_non_indemnise', 'stage_indemnise', 'moins_15k', '20_225k', '25_275k', '30_325k', '35-37,5K €', '40_45k', '45_50k', '50_55k', '60_65k', '70_75k');
  CREATE TYPE "public"."enum_offres_experience" AS ENUM('non_renseigne', '0_2_ans', '2_4_ans', '4_7_ans', '7_10_ans', 'plus_10_ans');
  CREATE TYPE "public"."enum_offres_statut" AS ENUM('publie', 'brouillon', 'attente');
  CREATE TYPE "public"."enum_evenements_type_localisation" AS ENUM('presentiel', 'enligne');
  CREATE TYPE "public"."enum_evenements_categorie" AS ENUM('conference', 'reseau', 'atelier', 'jpo');
  CREATE TYPE "public"."enum_evenements_mode_inscription" AS ENUM('plateforme', 'externe', 'libre');
  CREATE TYPE "public"."enum_evenements_statut" AS ENUM('publie', 'brouillon', 'attente');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "alumni_experiences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"poste" varchar NOT NULL,
  	"entreprise" varchar NOT NULL,
  	"localite" varchar NOT NULL,
  	"is_current" boolean DEFAULT false,
  	"date_debut" varchar NOT NULL,
  	"date_fin" varchar,
  	"description" varchar,
  	"match_formation" boolean DEFAULT false,
  	"secteur" varchar,
  	"type_contrat" varchar,
  	"is_cadre" boolean DEFAULT false,
  	"remuneration" varchar,
  	"provenance_emploi" varchar
  );
  
  CREATE TABLE "alumni_formations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"etablissement" varchar NOT NULL,
  	"annee" varchar,
  	"is_e_n_c" boolean DEFAULT false
  );
  
  CREATE TABLE "alumni_interets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL
  );
  
  CREATE TABLE "alumni_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "alumni" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prenom" varchar NOT NULL,
  	"nom" varchar NOT NULL,
  	"statut" "enum_alumni_statut" DEFAULT 'etudiant',
  	"bio" varchar,
  	"telephone" varchar,
  	"ville" varchar,
  	"diplome" varchar,
  	"promotion" numeric,
  	"poste" varchar,
  	"entreprise" varchar,
  	"social_links" jsonb,
  	"photo_id" integer,
  	"is_mentor" boolean DEFAULT false,
  	"linkedin" varchar,
  	"instagram" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"entreprise" varchar NOT NULL,
  	"ville" varchar NOT NULL,
  	"type_contrat" "enum_jobs_type_contrat" NOT NULL,
  	"secteur" varchar,
  	"remuneration" varchar,
  	"description" jsonb NOT NULL,
  	"date_limite" timestamp(3) with time zone,
  	"poster_par_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"categorie" "enum_groups_categorie" NOT NULL,
  	"description" varchar NOT NULL,
  	"miniature_id" integer NOT NULL,
  	"banniere_id" integer NOT NULL,
  	"is_public" boolean DEFAULT true,
  	"restrict_diplome" varchar,
  	"restrict_campus" varchar,
  	"restrict_categorie" varchar,
  	"restrict_promotion" varchar,
  	"createur_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "groups_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"alumni_id" integer
  );
  
  CREATE TABLE "social_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar,
  	"file_id" integer,
  	"owner_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"contenu" jsonb NOT NULL,
  	"categorie" "enum_articles_categorie" NOT NULL,
  	"statut" "enum_articles_statut" DEFAULT 'publie',
  	"couverture_id" integer NOT NULL,
  	"auteur_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contenu" varchar NOT NULL,
  	"image_id" integer,
  	"auteur_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "offres_restreindre_diplomes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_offres_restreindre_diplomes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "offres_restreindre_campus" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_offres_restreindre_campus",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "offres_restreindre_promotions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_offres_restreindre_promotions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "offres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"poste" varchar NOT NULL,
  	"entreprise" varchar NOT NULL,
  	"localisation" varchar NOT NULL,
  	"type_contrat" "enum_offres_type_contrat" NOT NULL,
  	"secteur" "enum_offres_secteur" NOT NULL,
  	"remuneration" "enum_offres_remuneration" NOT NULL,
  	"experience" "enum_offres_experience" NOT NULL,
  	"date_debut" timestamp(3) with time zone NOT NULL,
  	"date_limite" timestamp(3) with time zone NOT NULL,
  	"description" varchar NOT NULL,
  	"statut" "enum_offres_statut" DEFAULT 'publie',
  	"logo_id" integer,
  	"document_joint_id" integer,
  	"recruteur_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evenements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type_localisation" "enum_evenements_type_localisation" DEFAULT 'presentiel' NOT NULL,
  	"date_debut" timestamp(3) with time zone NOT NULL,
  	"date_fin" timestamp(3) with time zone NOT NULL,
  	"categorie" "enum_evenements_categorie" NOT NULL,
  	"description" jsonb NOT NULL,
  	"mode_inscription" "enum_evenements_mode_inscription" DEFAULT 'plateforme' NOT NULL,
  	"lien_externe" varchar,
  	"statut" "enum_evenements_statut" DEFAULT 'publie',
  	"couverture_id" integer NOT NULL,
  	"organisateur_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evenements_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"alumni_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"alumni_id" integer,
  	"media_id" integer,
  	"jobs_id" integer,
  	"groups_id" integer,
  	"social_links_id" integer,
  	"articles_id" integer,
  	"posts_id" integer,
  	"offres_id" integer,
  	"evenements_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"alumni_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alumni_experiences" ADD CONSTRAINT "alumni_experiences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alumni_formations" ADD CONSTRAINT "alumni_formations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alumni_interets" ADD CONSTRAINT "alumni_interets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alumni_sessions" ADD CONSTRAINT "alumni_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alumni" ADD CONSTRAINT "alumni_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_poster_par_id_alumni_id_fk" FOREIGN KEY ("poster_par_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_miniature_id_media_id_fk" FOREIGN KEY ("miniature_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_banniere_id_media_id_fk" FOREIGN KEY ("banniere_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups" ADD CONSTRAINT "groups_createur_id_alumni_id_fk" FOREIGN KEY ("createur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "groups_rels" ADD CONSTRAINT "groups_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "groups_rels" ADD CONSTRAINT "groups_rels_alumni_fk" FOREIGN KEY ("alumni_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "social_links" ADD CONSTRAINT "social_links_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "social_links" ADD CONSTRAINT "social_links_owner_id_alumni_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_couverture_id_media_id_fk" FOREIGN KEY ("couverture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_auteur_id_alumni_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_auteur_id_alumni_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offres_restreindre_diplomes" ADD CONSTRAINT "offres_restreindre_diplomes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offres_restreindre_campus" ADD CONSTRAINT "offres_restreindre_campus_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offres_restreindre_promotions" ADD CONSTRAINT "offres_restreindre_promotions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offres" ADD CONSTRAINT "offres_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offres" ADD CONSTRAINT "offres_document_joint_id_media_id_fk" FOREIGN KEY ("document_joint_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offres" ADD CONSTRAINT "offres_recruteur_id_alumni_id_fk" FOREIGN KEY ("recruteur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenements" ADD CONSTRAINT "evenements_couverture_id_media_id_fk" FOREIGN KEY ("couverture_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenements" ADD CONSTRAINT "evenements_organisateur_id_alumni_id_fk" FOREIGN KEY ("organisateur_id") REFERENCES "public"."alumni"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "evenements_rels" ADD CONSTRAINT "evenements_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."evenements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "evenements_rels" ADD CONSTRAINT "evenements_rels_alumni_fk" FOREIGN KEY ("alumni_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alumni_fk" FOREIGN KEY ("alumni_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_groups_fk" FOREIGN KEY ("groups_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_links_fk" FOREIGN KEY ("social_links_id") REFERENCES "public"."social_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offres_fk" FOREIGN KEY ("offres_id") REFERENCES "public"."offres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_evenements_fk" FOREIGN KEY ("evenements_id") REFERENCES "public"."evenements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_alumni_fk" FOREIGN KEY ("alumni_id") REFERENCES "public"."alumni"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "alumni_experiences_order_idx" ON "alumni_experiences" USING btree ("_order");
  CREATE INDEX "alumni_experiences_parent_id_idx" ON "alumni_experiences" USING btree ("_parent_id");
  CREATE INDEX "alumni_formations_order_idx" ON "alumni_formations" USING btree ("_order");
  CREATE INDEX "alumni_formations_parent_id_idx" ON "alumni_formations" USING btree ("_parent_id");
  CREATE INDEX "alumni_interets_order_idx" ON "alumni_interets" USING btree ("_order");
  CREATE INDEX "alumni_interets_parent_id_idx" ON "alumni_interets" USING btree ("_parent_id");
  CREATE INDEX "alumni_sessions_order_idx" ON "alumni_sessions" USING btree ("_order");
  CREATE INDEX "alumni_sessions_parent_id_idx" ON "alumni_sessions" USING btree ("_parent_id");
  CREATE INDEX "alumni_photo_idx" ON "alumni" USING btree ("photo_id");
  CREATE INDEX "alumni_updated_at_idx" ON "alumni" USING btree ("updated_at");
  CREATE INDEX "alumni_created_at_idx" ON "alumni" USING btree ("created_at");
  CREATE UNIQUE INDEX "alumni_email_idx" ON "alumni" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "jobs_poster_par_idx" ON "jobs" USING btree ("poster_par_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "groups_slug_idx" ON "groups" USING btree ("slug");
  CREATE INDEX "groups_miniature_idx" ON "groups" USING btree ("miniature_id");
  CREATE INDEX "groups_banniere_idx" ON "groups" USING btree ("banniere_id");
  CREATE INDEX "groups_createur_idx" ON "groups" USING btree ("createur_id");
  CREATE INDEX "groups_updated_at_idx" ON "groups" USING btree ("updated_at");
  CREATE INDEX "groups_created_at_idx" ON "groups" USING btree ("created_at");
  CREATE INDEX "groups_rels_order_idx" ON "groups_rels" USING btree ("order");
  CREATE INDEX "groups_rels_parent_idx" ON "groups_rels" USING btree ("parent_id");
  CREATE INDEX "groups_rels_path_idx" ON "groups_rels" USING btree ("path");
  CREATE INDEX "groups_rels_alumni_id_idx" ON "groups_rels" USING btree ("alumni_id");
  CREATE INDEX "social_links_file_idx" ON "social_links" USING btree ("file_id");
  CREATE INDEX "social_links_owner_idx" ON "social_links" USING btree ("owner_id");
  CREATE INDEX "social_links_updated_at_idx" ON "social_links" USING btree ("updated_at");
  CREATE INDEX "social_links_created_at_idx" ON "social_links" USING btree ("created_at");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_couverture_idx" ON "articles" USING btree ("couverture_id");
  CREATE INDEX "articles_auteur_idx" ON "articles" USING btree ("auteur_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "posts_image_idx" ON "posts" USING btree ("image_id");
  CREATE INDEX "posts_auteur_idx" ON "posts" USING btree ("auteur_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "offres_restreindre_diplomes_order_idx" ON "offres_restreindre_diplomes" USING btree ("order");
  CREATE INDEX "offres_restreindre_diplomes_parent_idx" ON "offres_restreindre_diplomes" USING btree ("parent_id");
  CREATE INDEX "offres_restreindre_campus_order_idx" ON "offres_restreindre_campus" USING btree ("order");
  CREATE INDEX "offres_restreindre_campus_parent_idx" ON "offres_restreindre_campus" USING btree ("parent_id");
  CREATE INDEX "offres_restreindre_promotions_order_idx" ON "offres_restreindre_promotions" USING btree ("order");
  CREATE INDEX "offres_restreindre_promotions_parent_idx" ON "offres_restreindre_promotions" USING btree ("parent_id");
  CREATE INDEX "offres_logo_idx" ON "offres" USING btree ("logo_id");
  CREATE INDEX "offres_document_joint_idx" ON "offres" USING btree ("document_joint_id");
  CREATE INDEX "offres_recruteur_idx" ON "offres" USING btree ("recruteur_id");
  CREATE INDEX "offres_updated_at_idx" ON "offres" USING btree ("updated_at");
  CREATE INDEX "offres_created_at_idx" ON "offres" USING btree ("created_at");
  CREATE UNIQUE INDEX "evenements_slug_idx" ON "evenements" USING btree ("slug");
  CREATE INDEX "evenements_couverture_idx" ON "evenements" USING btree ("couverture_id");
  CREATE INDEX "evenements_organisateur_idx" ON "evenements" USING btree ("organisateur_id");
  CREATE INDEX "evenements_updated_at_idx" ON "evenements" USING btree ("updated_at");
  CREATE INDEX "evenements_created_at_idx" ON "evenements" USING btree ("created_at");
  CREATE INDEX "evenements_rels_order_idx" ON "evenements_rels" USING btree ("order");
  CREATE INDEX "evenements_rels_parent_idx" ON "evenements_rels" USING btree ("parent_id");
  CREATE INDEX "evenements_rels_path_idx" ON "evenements_rels" USING btree ("path");
  CREATE INDEX "evenements_rels_alumni_id_idx" ON "evenements_rels" USING btree ("alumni_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_alumni_id_idx" ON "payload_locked_documents_rels" USING btree ("alumni_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("groups_id");
  CREATE INDEX "payload_locked_documents_rels_social_links_id_idx" ON "payload_locked_documents_rels" USING btree ("social_links_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_offres_id_idx" ON "payload_locked_documents_rels" USING btree ("offres_id");
  CREATE INDEX "payload_locked_documents_rels_evenements_id_idx" ON "payload_locked_documents_rels" USING btree ("evenements_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_alumni_id_idx" ON "payload_preferences_rels" USING btree ("alumni_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "alumni_experiences" CASCADE;
  DROP TABLE "alumni_formations" CASCADE;
  DROP TABLE "alumni_interets" CASCADE;
  DROP TABLE "alumni_sessions" CASCADE;
  DROP TABLE "alumni" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "groups" CASCADE;
  DROP TABLE "groups_rels" CASCADE;
  DROP TABLE "social_links" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "offres_restreindre_diplomes" CASCADE;
  DROP TABLE "offres_restreindre_campus" CASCADE;
  DROP TABLE "offres_restreindre_promotions" CASCADE;
  DROP TABLE "offres" CASCADE;
  DROP TABLE "evenements" CASCADE;
  DROP TABLE "evenements_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_alumni_statut";
  DROP TYPE "public"."enum_jobs_type_contrat";
  DROP TYPE "public"."enum_groups_categorie";
  DROP TYPE "public"."enum_articles_categorie";
  DROP TYPE "public"."enum_articles_statut";
  DROP TYPE "public"."enum_offres_restreindre_diplomes";
  DROP TYPE "public"."enum_offres_restreindre_campus";
  DROP TYPE "public"."enum_offres_restreindre_promotions";
  DROP TYPE "public"."enum_offres_type_contrat";
  DROP TYPE "public"."enum_offres_secteur";
  DROP TYPE "public"."enum_offres_remuneration";
  DROP TYPE "public"."enum_offres_experience";
  DROP TYPE "public"."enum_offres_statut";
  DROP TYPE "public"."enum_evenements_type_localisation";
  DROP TYPE "public"."enum_evenements_categorie";
  DROP TYPE "public"."enum_evenements_mode_inscription";
  DROP TYPE "public"."enum_evenements_statut";`)
}
