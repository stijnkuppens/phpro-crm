-- Re-add FK constraint for communications.contact_id → contacts
-- Lost when old contacts table was dropped and recreated in 00010b/00012
DELETE FROM communications WHERE contact_id IS NOT NULL AND contact_id NOT IN (SELECT id FROM contacts);
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_contact_id_fkey;
ALTER TABLE communications ADD CONSTRAINT communications_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
