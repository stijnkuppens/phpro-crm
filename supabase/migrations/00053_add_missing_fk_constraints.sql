-- Add missing FK constraints needed by PostgREST join queries

-- deals.contact_id → contacts
ALTER TABLE deals
  ADD CONSTRAINT deals_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- contact_personal_info.contact_id → contacts
DELETE FROM contact_personal_info WHERE contact_id NOT IN (SELECT id FROM contacts);
ALTER TABLE contact_personal_info
  ADD CONSTRAINT contact_personal_info_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
