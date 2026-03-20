-- Add project_manager column to accounts (present in demo CRM, missing from schema)
ALTER TABLE accounts ADD COLUMN project_manager text;
