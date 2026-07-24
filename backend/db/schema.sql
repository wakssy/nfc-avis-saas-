CREATE TABLE IF NOT EXISTS etablissements (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  lien_google_avis TEXT NOT NULL,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  etablissement_id TEXT NOT NULL REFERENCES etablissements(id),
  date_scan TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scans_etablissement_id ON scans(etablissement_id);
