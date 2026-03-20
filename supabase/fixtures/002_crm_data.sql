-- ============================================================================
-- Demo Fixture: Sample CRM data (accounts, contacts, communications)
-- DO NOT run in production.
-- ============================================================================

-- ── Accounts ────────────────────────────────────────────────────────────────
INSERT INTO accounts (id, name, domain, type, status, industry, size, revenue, phone, website, address, country, vat_number, owner_id, health, managing_partner, account_director, team, about, phpro_contract) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'TechVision NV', 'techvision.be', 'Klant', 'Actief', 'Technology', '51-200', 2500000, '+32 2 123 45 67', 'www.techvision.be', 'Kunstlaan 56, 1000 Brussel', 'BE', 'BE0123.456.789', NULL, 85, 'Jeroen', 'Bert', 'Team 1', 'TechVision is een Belgische enterprise software company gespecialiseerd in e-commerce en ERP-integraties.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000002', 'GreenLogistics BV', 'greenlogistics.nl', 'Prospect', 'Actief', 'Logistics', '201-1000', 8000000, '+31 20 987 65 43', 'www.greenlogistics.nl', 'Keizersgracht 112, 1017 Amsterdam', 'NL', 'NL123456789B01', NULL, 45, 'Nathalie', 'Jeroen', 'Team 2', '', 'Geen'),
  ('a0000000-0000-0000-0000-000000000003', 'MediCare Plus', 'medicareplus.be', 'Klant', 'Actief', 'Healthcare', '11-50', 750000, '+32 3 456 78 90', 'www.medicareplus.be', 'Mechelsesteenweg 271, 2018 Antwerpen', 'BE', 'BE0987.654.321', NULL, 72, 'Wim', 'Nathalie', 'Team 1', 'MediCare Plus is een toonaangevende zorginstelling in de Antwerpse regio.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000004', 'Barco NV', 'barco.com', 'Klant', 'Actief', 'Technology', '1000+', 120000000, '+32 56 23 32 11', 'www.barco.com', 'President Kennedypark 35, 8500 Kortrijk', 'BE', 'BE0473.191.041', NULL, 90, 'Jeroen', 'Bert', 'Team 1', 'Barco is een wereldleider in visualisatietechnologie voor entertainment, enterprise en healthcare.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000005', 'Melexis NV', 'melexis.com', 'Klant', 'Actief', 'Semiconductors', '1000+', 60000000, '+32 13 67 07 80', 'www.melexis.com', 'Transportstraat 1, 3980 Tessenderlo', 'BE', 'BE0435.604.729', NULL, 78, 'Wim', 'Nathalie', 'Team 2', 'Melexis ontwerpt en produceert halfgeleiders voor de automobielindustrie.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000006', 'Materialise NV', 'materialise.com', 'Partner', 'Actief', 'Manufacturing', '1000+', 230000000, '+32 16 39 66 11', 'www.materialise.com', 'Technologielaan 15, 3001 Leuven', 'BE', 'BE0441.131.254', NULL, 65, 'Nathalie', 'Jeroen', 'Team 1', 'Materialise is een pionier in 3D-printing software en services.', 'In onderhandeling'),
  ('a0000000-0000-0000-0000-000000000007', 'Colruyt Group', 'colruytgroup.com', 'Prospect', 'Actief', 'Retail', '1000+', 9800000000, '+32 2 363 55 45', 'www.colruytgroup.com', 'Edingensesteenweg 196, 1500 Halle', 'BE', 'BE0400.378.485', NULL, 50, 'Jeroen', 'Bert', 'Team 2', 'Colruyt Group is een Belgische retailgroep actief in food en non-food distributie.', 'Geen'),
  ('a0000000-0000-0000-0000-000000000008', 'Lotus Bakeries', 'lotusbakeries.com', 'Klant', 'Actief', 'Food & Beverage', '1000+', 1100000000, '+32 9 353 53 11', 'www.lotusbakeries.com', 'Gentstraat 1, 9971 Lembeke', 'BE', 'BE0401.030.860', NULL, 88, 'Wim', 'Nathalie', 'Team 1', 'Lotus Bakeries is een internationaal snoep- en koekjesbedrijf, bekend van Lotus Biscoff.', 'Actief'),
  ('a0000000-0000-0000-0000-000000000009', 'UCB SA', 'ucb.com', 'Prospect', 'Actief', 'Pharmaceuticals', '1000+', 5400000000, '+32 2 559 99 99', 'www.ucb.com', 'Allée de la Recherche 60, 1070 Brussel', 'BE', 'BE0403.053.608', NULL, 40, 'Nathalie', 'Jeroen', 'Team 2', 'UCB is een biofarmaceutisch bedrijf gericht op neurologie en immunologie.', 'Geen'),
  ('a0000000-0000-0000-0000-000000000010', 'Umicore NV', 'umicore.com', 'Partner', 'Actief', 'Materials', '1000+', 4200000000, '+32 2 227 71 11', 'www.umicore.com', 'Broekstraat 31, 1000 Brussel', 'BE', 'BE0401.574.852', NULL, 55, 'Jeroen', 'Bert', 'Team 1', 'Umicore is een wereldwijd materiaaltechnologie- en recyclingbedrijf.', 'In onderhandeling'),
  ('a0000000-0000-0000-0000-000000000011', 'Showpad BV', 'showpad.com', 'Klant', 'Actief', 'SaaS', '201-1000', 45000000, '+32 9 298 09 10', 'www.showpad.com', 'Tramstraat 59, 9000 Gent', 'BE', 'BE0543.854.752', NULL, 82, 'Wim', 'Nathalie', 'Team 2', 'Showpad is een sales enablement platform dat verkoopteams helpt effectiever te zijn.', 'Actief')
ON CONFLICT DO NOTHING;

-- ── Set account owners (lookup by email) ──────────────────────────────────
UPDATE accounts SET owner_id = (SELECT id FROM auth.users WHERE email = 'manager@example.com')
WHERE id = 'a0000000-0000-0000-0000-000000000001' AND owner_id IS NULL;
UPDATE accounts SET owner_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
WHERE id = 'a0000000-0000-0000-0000-000000000002' AND owner_id IS NULL;
UPDATE accounts SET owner_id = (SELECT id FROM auth.users WHERE email = 'manager@example.com')
WHERE id = 'a0000000-0000-0000-0000-000000000003' AND owner_id IS NULL;
UPDATE accounts SET owner_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
WHERE id IN ('a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000010') AND owner_id IS NULL;
UPDATE accounts SET owner_id = (SELECT id FROM auth.users WHERE email = 'manager@example.com')
WHERE id IN ('a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000011') AND owner_id IS NULL;

-- ── Account Tech Stacks (idempotent: clear + re-insert) ──────────────────
-- Ensure orphan tech values exist in ref table before FK insert
INSERT INTO ref_technologies (name) VALUES ('PIMCore'), ('Microsoft Dynamics'), ('.NET'), ('Python'), ('Java'), ('Symfony') ON CONFLICT (name) DO NOTHING;

DELETE FROM account_tech_stacks WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_tech_stacks (account_id, technology_id) VALUES
  -- TechVision
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_technologies WHERE name = 'SAP')),
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_technologies WHERE name = 'PIMCore')),
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_technologies WHERE name = 'Magento')),
  -- GreenLogistics
  ('a0000000-0000-0000-0000-000000000002', (SELECT id FROM ref_technologies WHERE name = 'SAP')),
  ('a0000000-0000-0000-0000-000000000002', (SELECT id FROM ref_technologies WHERE name = 'Microsoft Dynamics')),
  -- MediCare Plus
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_technologies WHERE name = 'Akeneo')),
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_technologies WHERE name = 'Shopware')),
  -- Barco
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_technologies WHERE name = 'React')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_technologies WHERE name = 'TypeScript')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_technologies WHERE name = 'AWS')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_technologies WHERE name = 'Docker')),
  -- Melexis
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_technologies WHERE name = 'Python')),
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_technologies WHERE name = '.NET')),
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_technologies WHERE name = 'Azure')),
  -- Materialise
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_technologies WHERE name = 'PHP')),
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_technologies WHERE name = 'Vue.js')),
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_technologies WHERE name = 'PostgreSQL')),
  -- Colruyt Group
  ('a0000000-0000-0000-0000-000000000007', (SELECT id FROM ref_technologies WHERE name = 'SAP')),
  ('a0000000-0000-0000-0000-000000000007', (SELECT id FROM ref_technologies WHERE name = 'Java')),
  ('a0000000-0000-0000-0000-000000000007', (SELECT id FROM ref_technologies WHERE name = 'Kubernetes')),
  -- Lotus Bakeries
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_technologies WHERE name = 'Magento')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_technologies WHERE name = 'Akeneo')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_technologies WHERE name = 'Elasticsearch')),
  -- UCB
  ('a0000000-0000-0000-0000-000000000009', (SELECT id FROM ref_technologies WHERE name = 'Salesforce')),
  ('a0000000-0000-0000-0000-000000000009', (SELECT id FROM ref_technologies WHERE name = 'Azure')),
  -- Umicore
  ('a0000000-0000-0000-0000-000000000010', (SELECT id FROM ref_technologies WHERE name = 'SAP')),
  ('a0000000-0000-0000-0000-000000000010', (SELECT id FROM ref_technologies WHERE name = 'Symfony')),
  ('a0000000-0000-0000-0000-000000000010', (SELECT id FROM ref_technologies WHERE name = 'Redis')),
  -- Showpad
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_technologies WHERE name = 'React')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_technologies WHERE name = 'Node.js')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_technologies WHERE name = 'GraphQL')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_technologies WHERE name = 'AWS'));

-- ── Account Manual Services (idempotent) ──────────────────────────────────
DELETE FROM account_manual_services WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_manual_services (account_id, service_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Adobe Commerce'),
  ('a0000000-0000-0000-0000-000000000003', 'Magento Open Source'),
  ('a0000000-0000-0000-0000-000000000004', 'Custom Platform'),
  ('a0000000-0000-0000-0000-000000000008', 'Adobe Commerce');

-- ── Account Samenwerkingsvormen (idempotent) ──────────────────────────────
DELETE FROM account_samenwerkingsvormen WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_samenwerkingsvormen (account_id, collaboration_type_id) VALUES
  -- TechVision
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_collaboration_types WHERE name = 'Continuous Dev.')),
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_collaboration_types WHERE name = 'Support')),
  -- MediCare Plus
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_collaboration_types WHERE name = 'Project')),
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_collaboration_types WHERE name = 'Ad Hoc')),
  -- Barco
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_collaboration_types WHERE name = 'Continuous Dev.')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_collaboration_types WHERE name = 'Consultancy')),
  -- Melexis
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_collaboration_types WHERE name = 'Project')),
  -- Materialise
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_collaboration_types WHERE name = 'Ad Hoc')),
  -- Lotus Bakeries
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_collaboration_types WHERE name = 'Continuous Dev.')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_collaboration_types WHERE name = 'Support')),
  -- Showpad
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_collaboration_types WHERE name = 'Project')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_collaboration_types WHERE name = 'Consultancy'));

-- ── Account Hosting (idempotent) ──────────────────────────────────────────
DELETE FROM account_hosting WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_hosting (account_id, provider_id, environment_id, url, notes) VALUES
  -- TechVision
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_hosting_providers WHERE name = 'AWS'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), 'https://console.aws.amazon.com', ''),
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_hosting_providers WHERE name = 'Hosted Power'), (SELECT id FROM ref_hosting_environments WHERE name = 'Staging'), '', 'Managed hosting staging omgeving'),
  -- MediCare Plus
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_hosting_providers WHERE name = 'Combell'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), '', 'Shared hosting pakket'),
  -- Barco
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_hosting_providers WHERE name = 'AWS'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), 'https://eu-west-1.console.aws.amazon.com', 'Multi-region setup'),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_hosting_providers WHERE name = 'AWS'), (SELECT id FROM ref_hosting_environments WHERE name = 'Staging'), '', ''),
  -- Melexis
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_hosting_providers WHERE name = 'Azure'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), '', 'Azure Kubernetes Service'),
  -- Materialise
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_hosting_providers WHERE name = 'Hetzner'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), '', 'Dedicated servers'),
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_hosting_providers WHERE name = 'Hetzner'), (SELECT id FROM ref_hosting_environments WHERE name = 'Development'), '', ''),
  -- Lotus Bakeries
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_hosting_providers WHERE name = 'Combell'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), '', ''),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_hosting_providers WHERE name = 'Combell'), (SELECT id FROM ref_hosting_environments WHERE name = 'Staging'), '', ''),
  -- Showpad
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_hosting_providers WHERE name = 'AWS'), (SELECT id FROM ref_hosting_environments WHERE name = 'Productie'), '', 'ECS Fargate'),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_hosting_providers WHERE name = 'Vercel'), (SELECT id FROM ref_hosting_environments WHERE name = 'Staging'), '', 'Frontend preview deploys');

-- ── Account Services (idempotent) ─────────────────────────────────────────
DELETE FROM account_services WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_services (account_id, service_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_cc_services WHERE name = 'E-commerce')),
  ('a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_cc_services WHERE name = 'PIM')),
  ('a0000000-0000-0000-0000-000000000003', (SELECT id FROM ref_cc_services WHERE name = 'E-commerce')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_cc_services WHERE name = 'UX/UI')),
  ('a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_cc_services WHERE name = 'Cloud & DevOps')),
  ('a0000000-0000-0000-0000-000000000005', (SELECT id FROM ref_cc_services WHERE name = 'Analytics')),
  ('a0000000-0000-0000-0000-000000000006', (SELECT id FROM ref_cc_services WHERE name = 'Strategie')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_cc_services WHERE name = 'E-commerce')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_cc_services WHERE name = 'PIM')),
  ('a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_cc_services WHERE name = 'SEO/SEA')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_cc_services WHERE name = 'UX/UI')),
  ('a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_cc_services WHERE name = 'QA & Testing'));

-- ── Account Competence Centers (idempotent) ───────────────────────────────
DELETE FROM account_competence_centers WHERE account_id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000011'
);
INSERT INTO account_competence_centers (id, account_id, competence_center_id, contact_person, email, phone, distribution) VALUES
  ('acc00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', (SELECT id FROM ref_competence_centers WHERE name = 'Induxx'), 'Peter Maes', 'peter@induxx.be', '+32 9 123 45 67', '4%'),
  ('acc00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_competence_centers WHERE name = 'Osudio'), 'Anna De Vries', 'anna@osudio.com', '+31 20 555 12 34', '50/50'),
  ('acc00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', (SELECT id FROM ref_competence_centers WHERE name = 'Humix'), 'Tom Janssen', 'tom@humix.be', '+32 2 444 55 66', '4%'),
  ('acc00000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000008', (SELECT id FROM ref_competence_centers WHERE name = 'Induxx'), 'Peter Maes', 'peter@induxx.be', '+32 9 123 45 67', '4%'),
  ('acc00000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000011', (SELECT id FROM ref_competence_centers WHERE name = 'Skivvy'), 'Lien Vermeersch', 'lien@skivvy.be', '+32 9 333 44 55', '50/50');

-- ── Account CC Services (junction for competence center services) ─────────
DELETE FROM account_cc_services WHERE account_competence_center_id IN (
  'acc00000-0000-0000-0000-000000000001','acc00000-0000-0000-0000-000000000002',
  'acc00000-0000-0000-0000-000000000003','acc00000-0000-0000-0000-000000000004',
  'acc00000-0000-0000-0000-000000000005'
);
INSERT INTO account_cc_services (account_competence_center_id, service_id) VALUES
  -- TechVision + Induxx: PIM, UX/UI
  ('acc00000-0000-0000-0000-000000000001', (SELECT id FROM ref_cc_services WHERE name = 'PIM')),
  ('acc00000-0000-0000-0000-000000000001', (SELECT id FROM ref_cc_services WHERE name = 'UX/UI')),
  -- Barco + Osudio: E-commerce, Strategie
  ('acc00000-0000-0000-0000-000000000002', (SELECT id FROM ref_cc_services WHERE name = 'E-commerce')),
  ('acc00000-0000-0000-0000-000000000002', (SELECT id FROM ref_cc_services WHERE name = 'Strategie')),
  -- Barco + Humix: Marketing Automation
  ('acc00000-0000-0000-0000-000000000003', (SELECT id FROM ref_cc_services WHERE name = 'Marketing Automation')),
  -- Lotus + Induxx: PIM, Content, SEO/SEA
  ('acc00000-0000-0000-0000-000000000004', (SELECT id FROM ref_cc_services WHERE name = 'PIM')),
  ('acc00000-0000-0000-0000-000000000004', (SELECT id FROM ref_cc_services WHERE name = 'Content')),
  ('acc00000-0000-0000-0000-000000000004', (SELECT id FROM ref_cc_services WHERE name = 'SEO/SEA')),
  -- Showpad + Skivvy: Analytics, QA & Testing
  ('acc00000-0000-0000-0000-000000000005', (SELECT id FROM ref_cc_services WHERE name = 'Analytics')),
  ('acc00000-0000-0000-0000-000000000005', (SELECT id FROM ref_cc_services WHERE name = 'QA & Testing'));

-- ── Contacts ────────────────────────────────────────────────────────────────
INSERT INTO contacts (id, account_id, first_name, last_name, email, phone, title, role, is_steerco, is_pinned) VALUES
  -- TechVision (existing)
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Marc', 'Vanderberg', 'marc@techvision.be', '+32 475 123', 'CTO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lotte', 'Pieters', 'lotte@techvision.be', '+32 476 456', 'Project Manager', 'Operationeel', false, false),
  -- GreenLogistics (existing)
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Dirk', 'Van Damme', 'dirk@greenlogistics.nl', '+31 6 123', 'CEO', 'Decision Maker', true, true),
  -- MediCare Plus (existing)
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Sarah', 'Leclercq', 'sarah@medicareplus.be', '+32 477 345', 'Managing Director', 'Decision Maker', true, true),
  -- Barco
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'Jan', 'De Witte', 'jan.dewitte@barco.com', '+32 56 23 33 00', 'VP Engineering', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'Katrien', 'Maes', 'katrien.maes@barco.com', '+32 56 23 33 01', 'IT Director', 'Influencer', true, false),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'Bram', 'Claes', 'bram.claes@barco.com', '+32 56 23 33 02', 'Lead Developer', 'Technisch', false, false),
  -- Melexis
  ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000005', 'Pieter', 'Janssens', 'pieter.janssens@melexis.com', '+32 13 67 07 81', 'CIO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000005', 'Els', 'Peeters', 'els.peeters@melexis.com', '+32 13 67 07 82', 'IT Manager', 'Operationeel', false, false),
  -- Materialise
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000006', 'Thomas', 'Wouters', 'thomas.wouters@materialise.com', '+32 16 39 66 12', 'Digital Director', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000006', 'Sophie', 'Hermans', 'sophie.hermans@materialise.com', '+32 16 39 66 13', 'UX Lead', 'Technisch', false, false),
  -- Colruyt Group
  ('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000007', 'Bart', 'Colruyt', 'bart.c@colruytgroup.com', '+32 2 363 55 46', 'Head of Digital', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000007', 'An', 'Stevens', 'an.stevens@colruytgroup.com', '+32 2 363 55 47', 'Procurement Manager', 'Financieel', false, false),
  -- Lotus Bakeries
  ('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000008', 'Kevin', 'Vandenberghe', 'kevin.v@lotusbakeries.com', '+32 9 353 53 12', 'E-commerce Manager', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000008', 'Leen', 'De Smedt', 'leen.ds@lotusbakeries.com', '+32 9 353 53 13', 'Marketing Director', 'Influencer', true, false),
  -- UCB
  ('c0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000009', 'Philippe', 'Lambert', 'philippe.lambert@ucb.com', '+32 2 559 99 01', 'CTO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000009', 'Marie', 'Dupont', 'marie.dupont@ucb.com', '+32 2 559 99 02', 'IT Architect', 'Technisch', false, false),
  -- Umicore
  ('c0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000010', 'Wout', 'Michiels', 'wout.michiels@umicore.com', '+32 2 227 71 12', 'Digital Transformation Lead', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000010', 'Hilde', 'Claessens', 'hilde.claessens@umicore.com', '+32 2 227 71 13', 'Project Coordinator', 'Operationeel', false, false),
  -- Showpad
  ('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000011', 'Pieter-Jan', 'De Smet', 'pj.desmet@showpad.com', '+32 9 298 09 11', 'VP Product', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000011', 'Laura', 'Van Hoeck', 'laura.vh@showpad.com', '+32 9 298 09 12', 'Engineering Manager', 'Technisch', false, true)
ON CONFLICT DO NOTHING;

-- ── Contact Personal Info ───────────────────────────────────────────────────
INSERT INTO contact_personal_info (contact_id, hobbies, marital_status, has_children, children_count, children_names, birthday, partner_name, partner_profession, notes, invite_dinner, invite_event, invite_gift) VALUES
  ('c0000000-0000-0000-0000-000000000001', ARRAY['Fietsen', 'Lopen'], 'Getrouwd', true, 2, 'Lena, Thomas', '15/03', 'Sophie', 'Advocate', 'Houdt van technologie en is een sterke beslisser. Prefers directe communicatie.', true, true, true),
  ('c0000000-0000-0000-0000-000000000002', '{}', '', false, 0, '', '', '', '', '', false, false, false),
  ('c0000000-0000-0000-0000-000000000003', ARRAY['Golf', 'Zeilen'], 'Getrouwd', true, 3, 'Emma, Jonas, Nina', '22/07', '', '', '', true, false, true),
  ('c0000000-0000-0000-0000-000000000005', '{}', 'Single', false, 0, '', '04/11', '', '', '', false, true, false),
  ('c0000000-0000-0000-0000-000000000006', ARRAY['Tennis', 'Reizen'], 'Getrouwd', true, 1, 'Lucas', '28/09', 'Veerle', 'Arts', '', true, true, true),
  ('c0000000-0000-0000-0000-000000000009', ARRAY['Padel', 'Fitness'], 'Getrouwd', true, 2, 'Noor, Senne', '12/05', 'Inge', 'Ingenieur', '', true, false, true),
  ('c0000000-0000-0000-0000-000000000015', ARRAY['Voetbal', 'Koken'], 'Getrouwd', false, 0, '', '03/08', 'Nele', 'Lerares', '', false, true, false),
  ('c0000000-0000-0000-0000-000000000017', ARRAY['Wielrennen', 'Lezen'], 'Getrouwd', true, 2, 'Emilie, Maxime', '19/01', 'Catherine', 'Apotheker', '', true, true, true)
ON CONFLICT DO NOTHING;
