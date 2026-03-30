/*
  Migration: Extend avatar storage upload policy
  Adds 'users/' and 'internal-people/' prefixes to the avatars_insert policy
  so user profile and internal people avatars can be uploaded.
*/

DROP POLICY IF EXISTS avatars_insert ON storage.objects;

CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = 'accounts'
      OR (storage.foldername(name))[1] = 'contacts'
      OR (storage.foldername(name))[1] = 'users'
      OR (storage.foldername(name))[1] = 'internal-people'
    )
  );
