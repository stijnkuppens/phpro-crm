-- Add avatar_url to internal people for profile photos
ALTER TABLE ref_internal_people ADD COLUMN IF NOT EXISTS avatar_url text;
