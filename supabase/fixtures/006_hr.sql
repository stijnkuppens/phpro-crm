-- ============================================================================
-- Fixture: HR demo data
-- ============================================================================

-- ── Employees ───────────────────────────────────────────────────────────────
INSERT INTO employees (id, first_name, last_name, date_of_birth, city, nationality, education, school, marital_status, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, hire_date, job_title, department, status, gross_salary, email, phone, notes) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Thomas', 'Declercq', '1990-04-12', 'Gent', 'Belgisch', 'Master Informatica', 'UGent', 'Gehuwd', 'Sarah Declercq', '+32 477 12 34 56', 'Echtgenote', '2018-09-01', 'Senior Developer', 'Engineering', 'actief', 4800, 'thomas.declercq@phpro.be', '+32 478 11 22 33', 'Tech lead voor Adobe Commerce projecten.'),
  ('e1000000-0000-0000-0000-000000000002', 'Nathalie', 'Wouters', '1993-08-25', 'Antwerpen', 'Belgisch', 'Bachelor Communicatie', 'AP Hogeschool', 'Ongehuwd', 'Inge Wouters', '+32 476 98 76 54', 'Moeder', '2020-02-01', 'Project Manager', 'Delivery', 'actief', 4200, 'nathalie.wouters@phpro.be', '+32 472 33 44 55', ''),
  ('e1000000-0000-0000-0000-000000000003', 'Kevin', 'Lemmens', '1987-01-30', 'Leuven', 'Belgisch', 'Master Bedrijfsinformatica', 'KU Leuven', 'Wettelijk samenwonend', 'Lies Lemmens', '+32 475 55 66 77', 'Partner', '2015-06-15', 'Tech Lead', 'Engineering', 'actief', 5300, 'kevin.lemmens@phpro.be', '+32 479 66 77 88', 'Verantwoordelijk voor architectuur beslissingen.'),
  ('e1000000-0000-0000-0000-000000000004', 'Elien', 'Martens', '1995-11-03', 'Brussel', 'Belgisch', 'Bachelor Office Management', 'Odisee', 'Ongehuwd', 'Johan Martens', '+32 474 21 32 43', 'Vader', '2022-03-07', 'HR Officer', 'HR', 'actief', 3600, 'elien.martens@phpro.be', '+32 471 44 55 66', '')
ON CONFLICT (id) DO NOTHING;

-- ── Employee Children ───────────────────────────────────────────────────────
INSERT INTO employee_children (employee_id, name, birth_year)
SELECT e.employee_id, e.name, e.birth_year
FROM (VALUES
  ('e1000000-0000-0000-0000-000000000001'::uuid, 'Lena', 2018),
  ('e1000000-0000-0000-0000-000000000001'::uuid, 'Finn', 2021),
  ('e1000000-0000-0000-0000-000000000003'::uuid, 'Emile', 2015)
) AS e(employee_id, name, birth_year)
WHERE NOT EXISTS (
  SELECT 1 FROM employee_children ec
  WHERE ec.employee_id = e.employee_id AND ec.name = e.name
);

-- ── Salary History ──────────────────────────────────────────────────────────
INSERT INTO salary_history (employee_id, date, gross_salary, reason, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000001', '2023-01-01', 4500, 'Jaarlijkse indexering', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO salary_history (employee_id, date, gross_salary, reason, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000001', '2024-01-01', 4650, 'Promotie naar Senior', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO salary_history (employee_id, date, gross_salary, reason, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000001', '2025-01-01', 4800, 'Jaarlijkse indexering', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO salary_history (employee_id, date, gross_salary, reason, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000003', '2024-06-01', 5300, 'Nieuwe functie Tech Lead', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- ── Equipment ───────────────────────────────────────────────────────────────
INSERT INTO equipment (employee_id, type, name, serial_number, date_issued)
SELECT e.employee_id, e.type, e.name, e.serial_number, e.date_issued
FROM (VALUES
  ('e1000000-0000-0000-0000-000000000001'::uuid, 'Laptop', 'MacBook Pro 16"', 'C02ZK1234XYZ', '2022-01-10'::date),
  ('e1000000-0000-0000-0000-000000000001'::uuid, 'Muis', 'Logitech MX Master 3', '', '2022-01-10'::date),
  ('e1000000-0000-0000-0000-000000000002'::uuid, 'Laptop', 'Dell XPS 13', '3K4XZ123', '2020-02-05'::date),
  ('e1000000-0000-0000-0000-000000000003'::uuid, 'Scherm', 'LG 27" 4K', 'LG2024K77', '2021-03-15'::date)
) AS e(employee_id, type, name, serial_number, date_issued)
WHERE NOT EXISTS (
  SELECT 1 FROM equipment eq
  WHERE eq.employee_id = e.employee_id AND eq.name = e.name
);

-- ── HR Documents ────────────────────────────────────────────────────────────
INSERT INTO hr_documents (employee_id, type, name, url, date)
SELECT e.employee_id, e.type, e.name, e.url, e.date
FROM (VALUES
  ('e1000000-0000-0000-0000-000000000001'::uuid, 'Arbeidscontract', 'Contract_Declercq_2018.pdf', '', '2018-09-01'::date),
  ('e1000000-0000-0000-0000-000000000002'::uuid, 'Arbeidscontract', 'Contract_Wouters_2020.pdf', '', '2020-02-01'::date)
) AS e(employee_id, type, name, url, date)
WHERE NOT EXISTS (
  SELECT 1 FROM hr_documents hd
  WHERE hd.employee_id = e.employee_id AND hd.name = e.name
);

-- ── Leave Balances ──────────────────────────────────────────────────────────
INSERT INTO leave_balances (employee_id, year, allowance, taken) VALUES
  ('e1000000-0000-0000-0000-000000000001', 2025, 20, 14),
  ('e1000000-0000-0000-0000-000000000002', 2025, 20, 8),
  ('e1000000-0000-0000-0000-000000000003', 2025, 22, 20),
  ('e1000000-0000-0000-0000-000000000004', 2025, 20, 5)
ON CONFLICT (employee_id, year) DO NOTHING;

-- ── Evaluations ─────────────────────────────────────────────────────────────
INSERT INTO evaluations (employee_id, date, type, score, notes, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000001', '2025-01-15', 'Evaluatie', 'Uitstekend', 'Sterke technische bijdrage, goede samenwerking.', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO evaluations (employee_id, date, type, score, notes, recorded_by)
SELECT 'e1000000-0000-0000-0000-000000000003', '2024-12-10', 'Functioneringsgesprek', 'Goed', 'Proactieve houding, werkt goed zelfstandig.', up.id
FROM user_profiles up WHERE up.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;
