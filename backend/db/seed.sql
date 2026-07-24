INSERT INTO etablissements (id, nom, lien_google_avis) VALUES
  ('1', 'Établissement de test 1', 'https://g.page/r/EXEMPLE-TEST-1/review'),
  ('2', 'Établissement de test 2', 'https://g.page/r/EXEMPLE-TEST-2/review')
ON CONFLICT (id) DO NOTHING;
