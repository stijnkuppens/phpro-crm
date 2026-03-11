-- Create storage buckets
INSERT INTO storage.buckets (id, name)
VALUES
  ('avatars', 'avatars'),
  ('documents', 'documents')
ON CONFLICT (id) DO NOTHING;

-- ── avatars bucket policies ─────────────────────
DROP POLICY IF EXISTS "authenticated_can_read_avatars" ON storage.objects;
CREATE POLICY "authenticated_can_read_avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "editors_can_upload_avatars" ON storage.objects;
CREATE POLICY "editors_can_upload_avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'editor')
  );

DROP POLICY IF EXISTS "editors_can_update_avatars" ON storage.objects;
CREATE POLICY "editors_can_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'editor'))
  WITH CHECK (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "admins_can_delete_avatars" ON storage.objects;
CREATE POLICY "admins_can_delete_avatars" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND public.get_user_role() = 'admin'
  );

-- ── documents bucket policies ───────────────────
DROP POLICY IF EXISTS "authenticated_can_read_documents" ON storage.objects;
CREATE POLICY "authenticated_can_read_documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "editors_can_upload_documents" ON storage.objects;
CREATE POLICY "editors_can_upload_documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'editor')
  );

DROP POLICY IF EXISTS "editors_can_update_documents" ON storage.objects;
CREATE POLICY "editors_can_update_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'editor'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "admins_can_delete_documents" ON storage.objects;
CREATE POLICY "admins_can_delete_documents" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND public.get_user_role() = 'admin'
  );
