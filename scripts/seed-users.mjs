// ===========================================
// VSX: Buy or Bail — Seed Users Script
// Run: node scripts/seed-users.mjs
// ===========================================

import { createClient } from '@supabase/supabase-js';

// You need to get your SERVICE_ROLE key from Supabase Dashboard:
// Project Settings → API → service_role (secret)
const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME'; // ⚠️ REPLACE THIS!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const STARTING_CAPITAL = 100000000; // ₹10 Crore

const USERS = [
  // Admin
  { username: 'admin', displayName: 'Administrator', password: 'admin123', role: 'admin' },
  
  // Participants
  { username: 'aaravsharma', displayName: 'Aarav Sharma', password: 'pass001', role: 'participant' },
  { username: 'vivaanpatel', displayName: 'Vivaan Patel', password: 'pass002', role: 'participant' },
  { username: 'adityasingh', displayName: 'Aditya Singh', password: 'pass003', role: 'participant' },
  { username: 'vihaankumar', displayName: 'Vihaan Kumar', password: 'pass004', role: 'participant' },
  { username: 'arjungupta', displayName: 'Arjun Gupta', password: 'pass005', role: 'participant' },
  { username: 'reyanshreddy', displayName: 'Reyansh Reddy', password: 'pass006', role: 'participant' },
  { username: 'saijoshi', displayName: 'Sai Joshi', password: 'pass007', role: 'participant' },
  { username: 'arnavmehta', displayName: 'Arnav Mehta', password: 'pass008', role: 'participant' },
  { username: 'dhruvnair', displayName: 'Dhruv Nair', password: 'pass009', role: 'participant' },
  { username: 'kabiriyer', displayName: 'Kabir Iyer', password: 'pass010', role: 'participant' },
  { username: 'ananyaverma', displayName: 'Ananya Verma', password: 'pass011', role: 'participant' },
  { username: 'diyamalhotra', displayName: 'Diya Malhotra', password: 'pass012', role: 'participant' },
  { username: 'myrakapoor', displayName: 'Myra Kapoor', password: 'pass013', role: 'participant' },
  { username: 'sarabhat', displayName: 'Sara Bhat', password: 'pass014', role: 'participant' },
  { username: 'aanyarao', displayName: 'Aanya Rao', password: 'pass015', role: 'participant' },
  { username: 'ishasaxena', displayName: 'Isha Saxena', password: 'pass016', role: 'participant' },
  { username: 'kiaradesai', displayName: 'Kiara Desai', password: 'pass017', role: 'participant' },
  { username: 'riyamishra', displayName: 'Riya Mishra', password: 'pass018', role: 'participant' },
  { username: 'priyachopra', displayName: 'Priya Chopra', password: 'pass019', role: 'participant' },
  { username: 'nehabanerjee', displayName: 'Neha Banerjee', password: 'pass020', role: 'participant' },
  { username: 'rohandas', displayName: 'Rohan Das', password: 'pass021', role: 'participant' },
  { username: 'karanpillai', displayName: 'Karan Pillai', password: 'pass022', role: 'participant' },
  { username: 'rahulmenon', displayName: 'Rahul Menon', password: 'pass023', role: 'participant' },
  { username: 'ajaykulkarni', displayName: 'Ajay Kulkarni', password: 'pass024', role: 'participant' },
  { username: 'vikramsrinivasan', displayName: 'Vikram Srinivasan', password: 'pass025', role: 'participant' },
  { username: 'nikhilchoudhury', displayName: 'Nikhil Choudhury', password: 'pass026', role: 'participant' },
  { username: 'amittiwari', displayName: 'Amit Tiwari', password: 'pass027', role: 'participant' },
  { username: 'rajagarwal', displayName: 'Raj Agarwal', password: 'pass028', role: 'participant' },
  { username: 'devshah', displayName: 'Dev Shah', password: 'pass029', role: 'participant' },
  { username: 'yashpandey', displayName: 'Yash Pandey', password: 'pass030', role: 'participant' },
  { username: 'snehabose', displayName: 'Sneha Bose', password: 'pass031', role: 'participant' },
  { username: 'poojasen', displayName: 'Pooja Sen', password: 'pass032', role: 'participant' },
  { username: 'nishamukherjee', displayName: 'Nisha Mukherjee', password: 'pass033', role: 'participant' },
  { username: 'kavyachauhan', displayName: 'Kavya Chauhan', password: 'pass034', role: 'participant' },
  { username: 'tanviyadav', displayName: 'Tanvi Yadav', password: 'pass035', role: 'participant' },
  { username: 'meerajain', displayName: 'Meera Jain', password: 'pass036', role: 'participant' },
  { username: 'zarathakur', displayName: 'Zara Thakur', password: 'pass037', role: 'participant' },
  { username: 'aisharanganathan', displayName: 'Aisha Ranganathan', password: 'pass038', role: 'participant' },
  { username: 'simrantrivedi', displayName: 'Simran Trivedi', password: 'pass039', role: 'participant' },
  { username: 'divyasaini', displayName: 'Divya Saini', password: 'pass040', role: 'participant' },
];

async function seedUsers() {
  console.log('🚀 Starting user seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const user of USERS) {
    const email = `${user.username}@vsx.local`;
    
    try {
      // Create auth user using Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          username: user.username,
          display_name: user.displayName,
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⏭️  User ${user.username} already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          username: user.username,
          display_name: user.displayName,
          role: user.role,
          cash_balance: STARTING_CAPITAL,
          starting_capital: STARTING_CAPITAL,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`❌ Profile error for ${user.username}:`, profileError.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Created: ${user.username} (${user.role})`);
      successCount++;
      
    } catch (err) {
      console.error(`❌ Error creating ${user.username}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('========================================\n');
}

// Check if SERVICE_ROLE_KEY is set
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: You must set your SERVICE_ROLE_KEY!');
  console.error('\n📋 How to get it:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings → API');
  console.error('4. Copy the "service_role" key (secret)');
  console.error('5. Paste it in this script (line 11)\n');
  process.exit(1);
}

seedUsers();
