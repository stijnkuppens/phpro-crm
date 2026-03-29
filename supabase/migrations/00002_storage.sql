/*
  Migration: Storage buckets
  Creates storage buckets and policies for:
  - avatars: public bucket for profile pictures
  - documents: private bucket for file attachments
*/

-- ── Buckets ─────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ── Avatars policies ────────────────────────────────────────────────────────

-- Anyone can view avatars (public bucket)
CREATE POLICY avatars_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars (only under accounts/ or contacts/ prefixes)
CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = 'accounts'
      OR (storage.foldername(name))[1] = 'contacts'
    )
  );

-- Authenticated users can update their own avatars (uid in path)
CREATE POLICY avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Authenticated users can delete their own avatars
CREATE POLICY avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- ── Documents policies ──────────────────────────────────────────────────────

-- Authenticated users can read documents
CREATE POLICY documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- Authenticated users can upload documents (only under accounts/ or contacts/ prefixes)
CREATE POLICY documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      (storage.foldername(name))[1] = 'accounts'
      OR (storage.foldername(name))[1] = 'contacts'
    )
  );

-- Authenticated users can update their own documents (uid in path)
CREATE POLICY documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Authenticated users can delete their own documents
CREATE POLICY documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
