-- ===========================================
-- VSX: Buy or Bail — Seed Users with Simple Auth
-- Run this AFTER migration-simple-auth.sql
-- ===========================================

-- Clear existing profiles (optional - comment out if you want to keep existing data)
-- DELETE FROM profiles;

-- Insert Admin
INSERT INTO profiles (id, username, display_name, role, password, cash_balance, starting_capital)
VALUES (
  gen_random_uuid(),
  'admin',
  'Admin',
  'admin',
  'admin123',
  100000,
  100000
) ON CONFLICT (username) DO UPDATE SET password = 'admin123', role = 'admin';

-- Insert 40 Participants
INSERT INTO profiles (id, username, display_name, role, password, cash_balance, starting_capital) VALUES
(gen_random_uuid(), 'aaravsharma', 'Aarav Sharma', 'participant', 'pass001', 100000, 100000),
(gen_random_uuid(), 'vivaanpatel', 'Vivaan Patel', 'participant', 'pass002', 100000, 100000),
(gen_random_uuid(), 'adityasingh', 'Aditya Singh', 'participant', 'pass003', 100000, 100000),
(gen_random_uuid(), 'vihaankumar', 'Vihaan Kumar', 'participant', 'pass004', 100000, 100000),
(gen_random_uuid(), 'arjungupta', 'Arjun Gupta', 'participant', 'pass005', 100000, 100000),
(gen_random_uuid(), 'reyanshreddy', 'Reyansh Reddy', 'participant', 'pass006', 100000, 100000),
(gen_random_uuid(), 'saijoshi', 'Sai Joshi', 'participant', 'pass007', 100000, 100000),
(gen_random_uuid(), 'arnavmehta', 'Arnav Mehta', 'participant', 'pass008', 100000, 100000),
(gen_random_uuid(), 'dhruvnair', 'Dhruv Nair', 'participant', 'pass009', 100000, 100000),
(gen_random_uuid(), 'kabiriyer', 'Kabir Iyer', 'participant', 'pass010', 100000, 100000),
(gen_random_uuid(), 'ananyaverma', 'Ananya Verma', 'participant', 'pass011', 100000, 100000),
(gen_random_uuid(), 'diyamalhotra', 'Diya Malhotra', 'participant', 'pass012', 100000, 100000),
(gen_random_uuid(), 'myrakapoor', 'Myra Kapoor', 'participant', 'pass013', 100000, 100000),
(gen_random_uuid(), 'sarabhat', 'Sara Bhat', 'participant', 'pass014', 100000, 100000),
(gen_random_uuid(), 'aanyarao', 'Aanya Rao', 'participant', 'pass015', 100000, 100000),
(gen_random_uuid(), 'ishasaxena', 'Isha Saxena', 'participant', 'pass016', 100000, 100000),
(gen_random_uuid(), 'kiaradesai', 'Kiara Desai', 'participant', 'pass017', 100000, 100000),
(gen_random_uuid(), 'riyamishra', 'Riya Mishra', 'participant', 'pass018', 100000, 100000),
(gen_random_uuid(), 'priyachopra', 'Priya Chopra', 'participant', 'pass019', 100000, 100000),
(gen_random_uuid(), 'nehabanerjee', 'Neha Banerjee', 'participant', 'pass020', 100000, 100000),
(gen_random_uuid(), 'rohandas', 'Rohan Das', 'participant', 'pass021', 100000, 100000),
(gen_random_uuid(), 'karanpillai', 'Karan Pillai', 'participant', 'pass022', 100000, 100000),
(gen_random_uuid(), 'rahulmenon', 'Rahul Menon', 'participant', 'pass023', 100000, 100000),
(gen_random_uuid(), 'ajaykulkarni', 'Ajay Kulkarni', 'participant', 'pass024', 100000, 100000),
(gen_random_uuid(), 'vikramsrinivasan', 'Vikram Srinivasan', 'participant', 'pass025', 100000, 100000),
(gen_random_uuid(), 'nikhilchoudhury', 'Nikhil Choudhury', 'participant', 'pass026', 100000, 100000),
(gen_random_uuid(), 'amittiwari', 'Amit Tiwari', 'participant', 'pass027', 100000, 100000),
(gen_random_uuid(), 'rajagarwal', 'Raj Agarwal', 'participant', 'pass028', 100000, 100000),
(gen_random_uuid(), 'devshah', 'Dev Shah', 'participant', 'pass029', 100000, 100000),
(gen_random_uuid(), 'yashpandey', 'Yash Pandey', 'participant', 'pass030', 100000, 100000),
(gen_random_uuid(), 'snehabose', 'Sneha Bose', 'participant', 'pass031', 100000, 100000),
(gen_random_uuid(), 'poojasen', 'Pooja Sen', 'participant', 'pass032', 100000, 100000),
(gen_random_uuid(), 'nishamukherjee', 'Nisha Mukherjee', 'participant', 'pass033', 100000, 100000),
(gen_random_uuid(), 'kavyachauhan', 'Kavya Chauhan', 'participant', 'pass034', 100000, 100000),
(gen_random_uuid(), 'tanviyadav', 'Tanvi Yadav', 'participant', 'pass035', 100000, 100000),
(gen_random_uuid(), 'meerajain', 'Meera Jain', 'participant', 'pass036', 100000, 100000),
(gen_random_uuid(), 'zarathakur', 'Zara Thakur', 'participant', 'pass037', 100000, 100000),
(gen_random_uuid(), 'aisharanganathan', 'Aisha Ranganathan', 'participant', 'pass038', 100000, 100000),
(gen_random_uuid(), 'simrantrivedi', 'Simran Trivedi', 'participant', 'pass039', 100000, 100000),
(gen_random_uuid(), 'divyasaini', 'Divya Saini', 'participant', 'pass040', 100000, 100000)
ON CONFLICT (username) DO UPDATE SET 
  password = EXCLUDED.password,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- Verify the data
SELECT username, display_name, role, password FROM profiles ORDER BY username;
