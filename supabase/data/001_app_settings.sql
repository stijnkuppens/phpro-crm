-- ============================================================================
-- Production Data: Default app settings
-- ============================================================================

INSERT INTO public.app_settings (key, value) VALUES
  ('app_name', '{"value": "PHPro CRM"}'::jsonb),
  ('logo_url',  '{"value": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
