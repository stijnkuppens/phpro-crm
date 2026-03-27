-- Add separate document upload fields alongside existing URL fields on contracts
-- Existing _pdf_url fields store external links (e.g. Confluence URLs)
-- New _doc_path fields store Supabase Storage paths for uploaded files

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS framework_doc_path text,
  ADD COLUMN IF NOT EXISTS service_doc_path text,
  ADD COLUMN IF NOT EXISTS purchase_orders_doc_path text;

COMMENT ON COLUMN contracts.framework_pdf_url IS 'External URL (e.g. Confluence) for raamcontract document';
COMMENT ON COLUMN contracts.framework_doc_path IS 'Supabase Storage path for uploaded raamcontract document';
COMMENT ON COLUMN contracts.service_pdf_url IS 'External URL (e.g. Confluence) for service contract document';
COMMENT ON COLUMN contracts.service_doc_path IS 'Supabase Storage path for uploaded service contract document';
COMMENT ON COLUMN contracts.purchase_orders_url IS 'External URL (e.g. Confluence) for purchase orders';
COMMENT ON COLUMN contracts.purchase_orders_doc_path IS 'Supabase Storage path for uploaded purchase orders document';
