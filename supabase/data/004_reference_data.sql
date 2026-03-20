-- ============================================================================
-- Production Data: Reference lookup tables
-- Source of truth: demo_crm/src/constants.ts
-- ============================================================================

-- ── ref_competence_centers (CC_NAMEN) ─────────────────────────────────────
INSERT INTO ref_competence_centers (name, sort_order) VALUES
  ('Induxx', 1),
  ('Humix', 2),
  ('Skivvy', 3),
  ('Enforce', 4),
  ('Osudio', 5),
  ('Youwe', 6),
  ('Burst Digital', 7),
  ('Propel', 8),
  ('Kodplex', 9),
  ('Elgenio', 10)
ON CONFLICT (name) DO NOTHING;

-- ── ref_cc_services (CC_SERVICES) ─────────────────────────────────────────
INSERT INTO ref_cc_services (name, sort_order) VALUES
  ('PIM', 1),
  ('UX/UI', 2),
  ('Strategie', 3),
  ('Marketing Automation', 4),
  ('SEO/SEA', 5),
  ('Content', 6),
  ('Analytics', 7),
  ('E-commerce', 8),
  ('ERP', 9),
  ('Cloud & DevOps', 10),
  ('QA & Testing', 11),
  ('Mobile', 12)
ON CONFLICT (name) DO NOTHING;

-- ── ref_consultant_roles (merged CONSULTANT_ROLES + TARIEF_ROLLEN) ────────
-- Union of both arrays produces the same 12 unique roles
INSERT INTO ref_consultant_roles (name, sort_order) VALUES
  ('PM', 1),
  ('PO', 2),
  ('Architect', 3),
  ('Tech Lead', 4),
  ('Dev Senior', 5),
  ('Dev Medior', 6),
  ('Dev Junior', 7),
  ('Analist', 8),
  ('UX Designer', 9),
  ('QA Engineer', 10),
  ('DevOps', 11),
  ('Scrum Master', 12)
ON CONFLICT (name) DO NOTHING;

-- ── ref_technologies (TECH_SUGGESTIONS) ───────────────────────────────────
INSERT INTO ref_technologies (name, sort_order) VALUES
  ('PHP', 1),
  ('JavaScript', 2),
  ('TypeScript', 3),
  ('React', 4),
  ('Vue.js', 5),
  ('Angular', 6),
  ('Node.js', 7),
  ('Magento', 8),
  ('Shopware', 9),
  ('Akeneo', 10),
  ('OroCommerce', 11),
  ('Adobe Commerce', 12),
  ('Hyva', 13),
  ('Docker', 14),
  ('Kubernetes', 15),
  ('AWS', 16),
  ('Azure', 17),
  ('MySQL', 18),
  ('PostgreSQL', 19),
  ('Redis', 20),
  ('Elasticsearch', 21),
  ('GraphQL', 22),
  ('REST API', 23),
  ('Git', 24),
  ('Jira', 25),
  ('Confluence', 26),
  ('SAP', 27),
  ('Salesforce', 28),
  ('PIMcore', 29),
  ('Marello', 30)
ON CONFLICT (name) DO NOTHING;

-- ── ref_hosting_providers (HOSTING_PROVIDERS) ─────────────────────────────
INSERT INTO ref_hosting_providers (name, sort_order) VALUES
  ('AWS', 1),
  ('Azure', 2),
  ('Google Cloud', 3),
  ('Combell', 4),
  ('Hosted Power', 5),
  ('OVHcloud', 6),
  ('Hetzner', 7),
  ('DigitalOcean', 8),
  ('Kinsta', 9),
  ('WP Engine', 10),
  ('Cloudways', 11),
  ('Vercel', 12),
  ('Netlify', 13),
  ('TransIP', 14)
ON CONFLICT (name) DO NOTHING;

-- ── ref_hosting_environments (HOSTING_OMGEVINGEN) ─────────────────────────
INSERT INTO ref_hosting_environments (name, sort_order) VALUES
  ('Productie', 1),
  ('Staging', 2),
  ('Development', 3),
  ('Test', 4),
  ('Demo', 5)
ON CONFLICT (name) DO NOTHING;

-- ── ref_languages (TALEN_LIJST) ──────────────────────────────────────────
INSERT INTO ref_languages (name, sort_order) VALUES
  ('Nederlands', 1),
  ('Frans', 2),
  ('Engels', 3),
  ('Duits', 4),
  ('Spaans', 5),
  ('Italiaans', 6),
  ('Arabisch', 7),
  ('Turks', 8)
ON CONFLICT (name) DO NOTHING;

-- ── ref_language_levels (TAAL_NIVEAUS) ────────────────────────────────────
INSERT INTO ref_language_levels (name, sort_order) VALUES
  ('Basis', 1),
  ('Gevorderd', 2),
  ('Vloeiend', 3),
  ('Moedertaal', 4)
ON CONFLICT (name) DO NOTHING;

-- ── ref_contact_roles (CONTACT_ROLES) ─────────────────────────────────────
INSERT INTO ref_contact_roles (name, sort_order) VALUES
  ('Decision Maker', 1),
  ('Influencer', 2),
  ('Champion', 3),
  ('Sponsor', 4),
  ('Steerco Lid', 5),
  ('Technisch', 6),
  ('Financieel', 7),
  ('Operationeel', 8),
  ('Contact', 9)
ON CONFLICT (name) DO NOTHING;

-- ── ref_hobbies (HOBBY_SUGGESTIONS) ───────────────────────────────────────
INSERT INTO ref_hobbies (name, sort_order) VALUES
  ('Fietsen', 1),
  ('Mountainbiken', 2),
  ('Wielrennen', 3),
  ('Lopen', 4),
  ('Wandelen', 5),
  ('Zwemmen', 6),
  ('Tennis', 7),
  ('Padel', 8),
  ('Golf', 9),
  ('Voetbal', 10),
  ('Basketbal', 11),
  ('Volleybal', 12),
  ('Badminton', 13),
  ('Squash', 14),
  ('Skiën', 15),
  ('Snowboarden', 16),
  ('Zeilen', 17),
  ('Surfen', 18),
  ('Klimmen', 19),
  ('Yoga', 20),
  ('Fitness', 21),
  ('Crossfit', 22),
  ('Martial arts', 23),
  ('Boksen', 24),
  ('Duiken', 25),
  ('Vissen', 26),
  ('Jagen', 27),
  ('Paardrijden', 28),
  ('Rugby', 29),
  ('Hockey', 30),
  ('Tafeltennis', 31),
  ('Dansen', 32),
  ('Muziek', 33),
  ('Schilderen', 34),
  ('Koken', 35),
  ('Fotografie', 36),
  ('Reizen', 37),
  ('Lezen', 38),
  ('Gaming', 39),
  ('Film & Cultuur', 40)
ON CONFLICT (name) DO NOTHING;

-- ── ref_sla_tools (SLA_TOOL_SUGGESTIONS) ──────────────────────────────────
INSERT INTO ref_sla_tools (name, sort_order) VALUES
  ('Graylog', 1),
  ('New Relic', 2),
  ('Datadog', 3),
  ('Pagerduty', 4),
  ('Grafana', 5),
  ('Kibana', 6),
  ('Sentry', 7),
  ('Splunk', 8),
  ('Dynatrace', 9),
  ('AppDynamics', 10),
  ('Zabbix', 11),
  ('Nagios', 12),
  ('Prometheus', 13),
  ('CloudWatch', 14),
  ('Azure Monitor', 15),
  ('OpsGenie', 16),
  ('VictorOps', 17),
  ('StatusPage', 18),
  ('Pingdom', 19),
  ('Uptime Robot', 20)
ON CONFLICT (name) DO NOTHING;

-- ── ref_collaboration_types (SAMENWERKINGSVORMEN) ─────────────────────────
INSERT INTO ref_collaboration_types (name, sort_order) VALUES
  ('Project', 1),
  ('Continuous Dev.', 2),
  ('Ad Hoc', 3),
  ('Support', 4),
  ('Consultancy', 5)
ON CONFLICT (name) DO NOTHING;

-- ── ref_stop_reasons (STOPZET_REDENEN) ────────────────────────────────────
INSERT INTO ref_stop_reasons (name, sort_order) VALUES
  ('Contract afgelopen', 1),
  ('Klant opgezegd', 2),
  ('Consultant opgezegd', 3),
  ('Project beëindigd', 4),
  ('Wederzijds akkoord', 5),
  ('Andere', 6)
ON CONFLICT (name) DO NOTHING;
