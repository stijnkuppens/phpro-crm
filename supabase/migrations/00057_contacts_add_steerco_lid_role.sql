-- Add 'Steerco Lid' to contacts.role CHECK constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_role_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_role_check
  CHECK (role IN ('Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid', 'Technisch', 'Financieel', 'Operationeel', 'Contact'));
