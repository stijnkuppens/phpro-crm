-- Add avatar/logo URL columns for contacts and accounts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url text;
