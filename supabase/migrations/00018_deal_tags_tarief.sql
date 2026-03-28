ALTER TABLE deals ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tarief_gewenst numeric;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tarief_aangeboden numeric;
