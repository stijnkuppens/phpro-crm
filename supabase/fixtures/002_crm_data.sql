-- ============================================================================
-- Demo Fixture: Sample CRM data (accounts, contacts, communications)
-- DO NOT run in production.
-- ============================================================================

-- ── Accounts ────────────────────────────────────────────────────────────────
INSERT INTO accounts (id, name, domain, type, status, industry, size, revenue, phone, website, address, country, vat_number, owner_id, health, managing_partner, account_director, team, about, phpro_contract) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'TechVision NV', 'techvision.be', 'Klant', 'Actief', 'Technology', '51-200', 2500000, '+32 2 123 45 67', 'www.techvision.be', 'Kunstlaan 56, 1000 Brussel', 'BE', 'BE0123.456.789', NULL, 85, 'Jeroen', 'Bert', 'Team 1', 'TechVision is een Belgische enterprise software company gespecialiseerd in e-commerce en ERP-integraties.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000002', 'GreenLogistics BV', 'greenlogistics.nl', 'Prospect', 'Actief', 'Logistics', '201-1000', 8000000, '+31 20 987 65 43', 'www.greenlogistics.nl', 'Keizersgracht 112, 1017 Amsterdam', 'NL', 'NL123456789B01', NULL, 45, 'Nathalie', 'Jeroen', 'Team 2', '', 'Geen'),
  ('a0000000-0000-0000-0000-000000000003', 'MediCare Plus', 'medicareplus.be', 'Klant', 'Actief', 'Healthcare', '11-50', 750000, '+32 3 456 78 90', 'www.medicareplus.be', 'Mechelsesteenweg 271, 2018 Antwerpen', 'BE', 'BE0987.654.321', NULL, 72, 'Wim', 'Nathalie', 'Team 1', 'MediCare Plus is een toonaangevende zorginstelling in de Antwerpse regio.', 'Actief')
ON CONFLICT DO NOTHING;

-- ── Account Tech Stacks ────────────────────────────────────────────────────
INSERT INTO account_tech_stacks (account_id, technology) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SAP'),
  ('a0000000-0000-0000-0000-000000000001', 'PIMCore'),
  ('a0000000-0000-0000-0000-000000000001', 'Magento'),
  ('a0000000-0000-0000-0000-000000000002', 'SAP'),
  ('a0000000-0000-0000-0000-000000000002', 'Microsoft Dynamics'),
  ('a0000000-0000-0000-0000-000000000003', 'Akeneo'),
  ('a0000000-0000-0000-0000-000000000003', 'Shopware');

-- ── Account Manual Services ────────────────────────────────────────────────
INSERT INTO account_manual_services (account_id, service_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Adobe Commerce'),
  ('a0000000-0000-0000-0000-000000000003', 'Magento Open Source');

-- ── Account Samenwerkingsvormen ────────────────────────────────────────────
INSERT INTO account_samenwerkingsvormen (account_id, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Continuous Dev.'),
  ('a0000000-0000-0000-0000-000000000001', 'Support'),
  ('a0000000-0000-0000-0000-000000000003', 'Project'),
  ('a0000000-0000-0000-0000-000000000003', 'Ad Hoc');

-- ── Account Hosting ────────────────────────────────────────────────────────
INSERT INTO account_hosting (account_id, provider, environment, url, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'AWS', 'Productie', 'https://console.aws.amazon.com', ''),
  ('a0000000-0000-0000-0000-000000000001', 'Hosted Power', 'Staging', '', 'Managed hosting staging omgeving'),
  ('a0000000-0000-0000-0000-000000000003', 'Combell', 'Productie', '', 'Shared hosting pakket');

-- ── Contacts ────────────────────────────────────────────────────────────────
INSERT INTO contacts (id, account_id, first_name, last_name, email, phone, title, role, is_steerco, is_pinned) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Marc', 'Vanderberg', 'marc@techvision.be', '+32 475 123', 'CTO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lotte', 'Pieters', 'lotte@techvision.be', '+32 476 456', 'Project Manager', 'Operationeel', false, false),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Dirk', 'Van Damme', 'dirk@greenlogistics.nl', '+31 6 123', 'CEO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Sarah', 'Leclercq', 'sarah@medicareplus.be', '+32 477 345', 'Managing Director', 'Decision Maker', true, true)
ON CONFLICT DO NOTHING;

-- ── Contact Personal Info ───────────────────────────────────────────────────
INSERT INTO contact_personal_info (contact_id, hobbies, marital_status, has_children, children_count, children_names, birthday, partner_name, partner_profession, notes, invite_dinner, invite_event, invite_gift) VALUES
  ('c0000000-0000-0000-0000-000000000001', ARRAY['Fietsen', 'Lopen'], 'Getrouwd', true, 2, 'Lena, Thomas', '15/03', 'Sophie', 'Advocate', 'Houdt van technologie en is een sterke beslisser. Prefers directe communicatie.', true, true, true),
  ('c0000000-0000-0000-0000-000000000002', '{}', '', false, 0, '', '', '', '', '', false, false, false),
  ('c0000000-0000-0000-0000-000000000003', ARRAY['Golf', 'Zeilen'], 'Getrouwd', true, 3, 'Emma, Jonas, Nina', '22/07', '', '', '', true, false, true),
  ('c0000000-0000-0000-0000-000000000005', '{}', 'Single', false, 0, '', '04/11', '', '', '', false, true, false)
ON CONFLICT DO NOTHING;
