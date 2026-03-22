-- Add missing FK constraints needed by PostgREST join queries
-- Uses DO blocks to skip if constraint already exists.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_contact_id_fkey') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_personal_info_contact_id_fkey') THEN
    DELETE FROM contact_personal_info WHERE contact_id NOT IN (SELECT id FROM contacts);
    ALTER TABLE contact_personal_info ADD CONSTRAINT contact_personal_info_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
  END IF;
END $$;
