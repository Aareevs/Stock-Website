-- ===========================================
-- VSX: Buy or Bail — Seed Users
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ===========================================

-- ─── Create Admin User ───
-- Password: admin123
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@vsx.local',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@vsx.local"}',
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;


-- ─── Create Participant Users ───
-- All participants have password: pass + 3-digit number (e.g., pass001, pass002, etc.)

-- Participant 1: aaravsharma / pass001
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'aaravsharma@vsx.local', crypt('pass001', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '{"sub":"b0000000-0000-0000-0000-000000000001","email":"aaravsharma@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000001', 'aaravsharma', 'Aarav Sharma', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 2: vivaanpatel / pass002
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'vivaanpatel@vsx.local', crypt('pass002', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '{"sub":"b0000000-0000-0000-0000-000000000002","email":"vivaanpatel@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000002', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000002', 'vivaanpatel', 'Vivaan Patel', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 3: adityasingh / pass003
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'adityasingh@vsx.local', crypt('pass003', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '{"sub":"b0000000-0000-0000-0000-000000000003","email":"adityasingh@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000003', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000003', 'adityasingh', 'Aditya Singh', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 4: vihaankumar / pass004
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'vihaankumar@vsx.local', crypt('pass004', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '{"sub":"b0000000-0000-0000-0000-000000000004","email":"vihaankumar@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000004', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000004', 'vihaankumar', 'Vihaan Kumar', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 5: arjungupta / pass005
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'arjungupta@vsx.local', crypt('pass005', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '{"sub":"b0000000-0000-0000-0000-000000000005","email":"arjungupta@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000005', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000005', 'arjungupta', 'Arjun Gupta', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 6: reyanshreddy / pass006
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'reyanshreddy@vsx.local', crypt('pass006', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', '{"sub":"b0000000-0000-0000-0000-000000000006","email":"reyanshreddy@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000006', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000006', 'reyanshreddy', 'Reyansh Reddy', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 7: saijoshi / pass007
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'saijoshi@vsx.local', crypt('pass007', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', '{"sub":"b0000000-0000-0000-0000-000000000007","email":"saijoshi@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000007', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000007', 'saijoshi', 'Sai Joshi', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 8: arnavmehta / pass008
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'arnavmehta@vsx.local', crypt('pass008', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', '{"sub":"b0000000-0000-0000-0000-000000000008","email":"arnavmehta@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000008', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000008', 'arnavmehta', 'Arnav Mehta', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 9: dhruvnair / pass009
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'dhruvnair@vsx.local', crypt('pass009', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', '{"sub":"b0000000-0000-0000-0000-000000000009","email":"dhruvnair@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000009', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000009', 'dhruvnair', 'Dhruv Nair', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 10: kabiriyer / pass010
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'kabiriyer@vsx.local', crypt('pass010', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', '{"sub":"b0000000-0000-0000-0000-000000000010","email":"kabiriyer@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000010', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000010', 'kabiriyer', 'Kabir Iyer', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 11: ananyaverma / pass011
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'ananyaverma@vsx.local', crypt('pass011', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', '{"sub":"b0000000-0000-0000-0000-000000000011","email":"ananyaverma@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000011', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000011', 'ananyaverma', 'Ananya Verma', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 12: diyamalhotra / pass012
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'diyamalhotra@vsx.local', crypt('pass012', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', '{"sub":"b0000000-0000-0000-0000-000000000012","email":"diyamalhotra@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000012', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000012', 'diyamalhotra', 'Diya Malhotra', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 13: myrakapoor / pass013
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'myrakapoor@vsx.local', crypt('pass013', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000013', '{"sub":"b0000000-0000-0000-0000-000000000013","email":"myrakapoor@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000013', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000013', 'myrakapoor', 'Myra Kapoor', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 14: sarabhat / pass014
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'sarabhat@vsx.local', crypt('pass014', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000014', '{"sub":"b0000000-0000-0000-0000-000000000014","email":"sarabhat@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000014', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000014', 'sarabhat', 'Sara Bhat', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 15: aanyarao / pass015
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'aanyarao@vsx.local', crypt('pass015', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000015', '{"sub":"b0000000-0000-0000-0000-000000000015","email":"aanyarao@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000015', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000015', 'aanyarao', 'Aanya Rao', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 16: ishasaxena / pass016
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'ishasaxena@vsx.local', crypt('pass016', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000016', '{"sub":"b0000000-0000-0000-0000-000000000016","email":"ishasaxena@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000016', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000016', 'ishasaxena', 'Isha Saxena', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 17: kiaradesai / pass017
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'kiaradesai@vsx.local', crypt('pass017', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000017', '{"sub":"b0000000-0000-0000-0000-000000000017","email":"kiaradesai@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000017', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000017', 'kiaradesai', 'Kiara Desai', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 18: riyamishra / pass018
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'riyamishra@vsx.local', crypt('pass018', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000018', '{"sub":"b0000000-0000-0000-0000-000000000018","email":"riyamishra@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000018', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000018', 'riyamishra', 'Riya Mishra', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 19: priyachopra / pass019
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'priyachopra@vsx.local', crypt('pass019', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000019', '{"sub":"b0000000-0000-0000-0000-000000000019","email":"priyachopra@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000019', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000019', 'priyachopra', 'Priya Chopra', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 20: nehabanerjee / pass020
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'nehabanerjee@vsx.local', crypt('pass020', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000020', '{"sub":"b0000000-0000-0000-0000-000000000020","email":"nehabanerjee@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000020', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000020', 'nehabanerjee', 'Neha Banerjee', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 21: rohandas / pass021
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'rohandas@vsx.local', crypt('pass021', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000021', '{"sub":"b0000000-0000-0000-0000-000000000021","email":"rohandas@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000021', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000021', 'rohandas', 'Rohan Das', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 22: karanpillai / pass022
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'karanpillai@vsx.local', crypt('pass022', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000022', '{"sub":"b0000000-0000-0000-0000-000000000022","email":"karanpillai@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000022', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000022', 'karanpillai', 'Karan Pillai', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 23: rahulmenon / pass023
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', 'rahulmenon@vsx.local', crypt('pass023', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000023', '{"sub":"b0000000-0000-0000-0000-000000000023","email":"rahulmenon@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000023', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000023', 'rahulmenon', 'Rahul Menon', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 24: ajaykulkarni / pass024
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000000', 'ajaykulkarni@vsx.local', crypt('pass024', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000024', '{"sub":"b0000000-0000-0000-0000-000000000024","email":"ajaykulkarni@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000024', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000024', 'ajaykulkarni', 'Ajay Kulkarni', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 25: vikramsrinivasan / pass025
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000000', 'vikramsrinivasan@vsx.local', crypt('pass025', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000025', '{"sub":"b0000000-0000-0000-0000-000000000025","email":"vikramsrinivasan@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000025', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000025', 'vikramsrinivasan', 'Vikram Srinivasan', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 26: nikhilchoudhury / pass026
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000000', 'nikhilchoudhury@vsx.local', crypt('pass026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000026', '{"sub":"b0000000-0000-0000-0000-000000000026","email":"nikhilchoudhury@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000026', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000026', 'nikhilchoudhury', 'Nikhil Choudhury', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 27: amittiwari / pass027
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000000', 'amittiwari@vsx.local', crypt('pass027', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000027', '{"sub":"b0000000-0000-0000-0000-000000000027","email":"amittiwari@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000027', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000027', 'amittiwari', 'Amit Tiwari', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 28: rajagarwal / pass028
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000000', 'rajagarwal@vsx.local', crypt('pass028', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000028', '{"sub":"b0000000-0000-0000-0000-000000000028","email":"rajagarwal@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000028', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000028', 'rajagarwal', 'Raj Agarwal', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 29: devshah / pass029
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000000', 'devshah@vsx.local', crypt('pass029', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000029', '{"sub":"b0000000-0000-0000-0000-000000000029","email":"devshah@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000029', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000029', 'devshah', 'Dev Shah', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 30: yashpandey / pass030
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000000', 'yashpandey@vsx.local', crypt('pass030', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000030', '{"sub":"b0000000-0000-0000-0000-000000000030","email":"yashpandey@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000030', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000030', 'yashpandey', 'Yash Pandey', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 31: snehabose / pass031
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000000', 'snehabose@vsx.local', crypt('pass031', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000031', '{"sub":"b0000000-0000-0000-0000-000000000031","email":"snehabose@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000031', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000031', 'snehabose', 'Sneha Bose', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 32: poojasem / pass032
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000000', 'poojasen@vsx.local', crypt('pass032', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000032', '{"sub":"b0000000-0000-0000-0000-000000000032","email":"poojasen@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000032', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000032', 'poojasen', 'Pooja Sen', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 33: nishamukherjee / pass033
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000000', 'nishamukherjee@vsx.local', crypt('pass033', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000033', '{"sub":"b0000000-0000-0000-0000-000000000033","email":"nishamukherjee@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000033', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000033', 'nishamukherjee', 'Nisha Mukherjee', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 34: kavyachauhan / pass034
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000000', 'kavyachauhan@vsx.local', crypt('pass034', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000034', '{"sub":"b0000000-0000-0000-0000-000000000034","email":"kavyachauhan@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000034', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000034', 'kavyachauhan', 'Kavya Chauhan', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 35: tanviyadav / pass035
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000000', 'tanviyadav@vsx.local', crypt('pass035', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000035', '{"sub":"b0000000-0000-0000-0000-000000000035","email":"tanviyadav@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000035', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000035', 'tanviyadav', 'Tanvi Yadav', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 36: meerajain / pass036
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000000', 'meerajain@vsx.local', crypt('pass036', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000036', 'b0000000-0000-0000-0000-000000000036', '{"sub":"b0000000-0000-0000-0000-000000000036","email":"meerajain@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000036', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000036', 'meerajain', 'Meera Jain', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 37: zarathakur / pass037
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000000', 'zarathakur@vsx.local', crypt('pass037', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000037', 'b0000000-0000-0000-0000-000000000037', '{"sub":"b0000000-0000-0000-0000-000000000037","email":"zarathakur@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000037', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000037', 'zarathakur', 'Zara Thakur', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 38: aisharanganathan / pass038
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000000', 'aisharanganathan@vsx.local', crypt('pass038', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000038', '{"sub":"b0000000-0000-0000-0000-000000000038","email":"aisharanganathan@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000038', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000038', 'aisharanganathan', 'Aisha Ranganathan', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 39: simrantrivedi / pass039
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000000', 'simrantrivedi@vsx.local', crypt('pass039', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000039', 'b0000000-0000-0000-0000-000000000039', '{"sub":"b0000000-0000-0000-0000-000000000039","email":"simrantrivedi@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000039', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000039', 'simrantrivedi', 'Simran Trivedi', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Participant 40: divyasaini / pass040
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES ('b0000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000000', 'divyasaini@vsx.local', crypt('pass040', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES ('b0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000040', '{"sub":"b0000000-0000-0000-0000-000000000040","email":"divyasaini@vsx.local"}', 'email', 'b0000000-0000-0000-0000-000000000040', now(), now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO profiles (id, username, display_name, role, cash_balance, starting_capital)
VALUES ('b0000000-0000-0000-0000-000000000040', 'divyasaini', 'Divya Saini', 'participant', 100000000, 100000000)
ON CONFLICT (id) DO NOTHING;

-- Done! All 40 participants + 1 admin created.
