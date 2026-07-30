CREATE TABLE IF NOT EXISTS etablissements (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  lien_google_avis TEXT NOT NULL,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS objectif_mensuel INTEGER;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS message_relance TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS paiement_token TEXT UNIQUE;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS abonnement_statut TEXT;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS mois_payes INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  date_scan TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scans_etablissement_id ON scans(etablissement_id);

CREATE TABLE IF NOT EXISTS avis_historique (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre_avis INTEGER NOT NULL,
  note_moyenne NUMERIC(2, 1) NOT NULL,
  UNIQUE (etablissement_id, date)
);

CREATE INDEX IF NOT EXISTS idx_avis_historique_etablissement_id ON avis_historique(etablissement_id);

CREATE TABLE IF NOT EXISTS concurrents (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  concurrent_place_id TEXT NOT NULL,
  concurrent_nom TEXT NOT NULL,
  date_ajout TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (etablissement_id, concurrent_place_id)
);

CREATE INDEX IF NOT EXISTS idx_concurrents_etablissement_id ON concurrents(etablissement_id);

CREATE TABLE IF NOT EXISTS concurrents_historique (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  concurrent_place_id TEXT NOT NULL,
  concurrent_nom TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre_avis INTEGER NOT NULL,
  note_moyenne NUMERIC(2, 1) NOT NULL,
  UNIQUE (etablissement_id, concurrent_place_id, date)
);

CREATE INDEX IF NOT EXISTS idx_concurrents_historique_etablissement_id ON concurrents_historique(etablissement_id);

ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS positionnement_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS avis_recus (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  auteur TEXT NOT NULL,
  note INTEGER NOT NULL,
  texte_avis TEXT,
  date_avis TIMESTAMPTZ NOT NULL,
  reponse_suggeree TEXT,
  reponse_marquee_traitee BOOLEAN NOT NULL DEFAULT false,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (etablissement_id, auteur, date_avis, note)
);

CREATE INDEX IF NOT EXISTS idx_avis_recus_etablissement_id ON avis_recus(etablissement_id);
