-- ============================================================================
-- Production Data: Divisions and division services
-- ============================================================================

INSERT INTO divisions (id, name, color, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', '25Carat', '#3b82f6', 1),
  ('d1000000-0000-0000-0000-000000000002', 'PHPro', '#10b981', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO division_services (division_id, service_name, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'OroCommerce', 1),
  ('d1000000-0000-0000-0000-000000000001', 'Marello OMS', 2),
  ('d1000000-0000-0000-0000-000000000001', 'Marello B2B', 3),
  ('d1000000-0000-0000-0000-000000000002', 'Magento', 1),
  ('d1000000-0000-0000-0000-000000000002', 'Adobe Commerce', 2),
  ('d1000000-0000-0000-0000-000000000002', 'Sulu CMS', 3),
  ('d1000000-0000-0000-0000-000000000002', 'Custom Dev', 4),
  ('d1000000-0000-0000-0000-000000000002', 'Consultancy', 5)
ON CONFLICT DO NOTHING;
