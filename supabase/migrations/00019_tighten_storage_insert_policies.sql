/*
  Migration: Tighten storage INSERT policies
  Restricts uploads so authenticated users can only insert into paths
  prefixed with a known entity folder (accounts/ or contacts/).
  Previously any authenticated user could upload to any path.
*/

-- Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS avatars_insert ON storage.objects;
DROP POLICY IF EXISTS documents_insert ON storage.objects;

-- Avatars: only allow uploads under accounts/ or contacts/ prefixes
CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = 'accounts'
      OR (storage.foldername(name))[1] = 'contacts'
    )
  );

-- Documents: only allow uploads under accounts/ or contacts/ prefixes
CREATE POLICY documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = 'accounts'
      OR (storage.foldername(name))[1] = 'contacts'
    )
  );
