// Fix auth users for existing profiles
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  { username: 'admin', password: 'admin123' },
  { username: 'aaravsharma', password: 'pass001' },
  { username: 'vivaanpatel', password: 'pass002' },
  { username: 'adityasingh', password: 'pass003' },
  { username: 'vihaankumar', password: 'pass004' },
  { username: 'arjungupta', password: 'pass005' },
  { username: 'reyanshreddy', password: 'pass006' },
  { username: 'saijoshi', password: 'pass007' },
  { username: 'arnavmehta', password: 'pass008' },
  { username: 'dhruvnair', password: 'pass009' },
  { username: 'kabiriyer', password: 'pass010' },
  { username: 'ananyaverma', password: 'pass011' },
  { username: 'diyamalhotra', password: 'pass012' },
  { username: 'myrakapoor', password: 'pass013' },
  { username: 'sarabhat', password: 'pass014' },
  { username: 'aanyarao', password: 'pass015' },
  { username: 'ishasaxena', password: 'pass016' },
  { username: 'kiaradesai', password: 'pass017' },
  { username: 'riyamishra', password: 'pass018' },
  { username: 'priyachopra', password: 'pass019' },
  { username: 'nehabanerjee', password: 'pass020' },
  { username: 'rohandas', password: 'pass021' },
  { username: 'karanpillai', password: 'pass022' },
  { username: 'rahulmenon', password: 'pass023' },
  { username: 'ajaykulkarni', password: 'pass024' },
  { username: 'vikramsrinivasan', password: 'pass025' },
  { username: 'nikhilchoudhury', password: 'pass026' },
  { username: 'amittiwari', password: 'pass027' },
  { username: 'rajagarwal', password: 'pass028' },
  { username: 'devshah', password: 'pass029' },
  { username: 'yashpandey', password: 'pass030' },
  { username: 'snehabose', password: 'pass031' },
  { username: 'poojasen', password: 'pass032' },
  { username: 'nishamukherjee', password: 'pass033' },
  { username: 'kavyachauhan', password: 'pass034' },
  { username: 'tanviyadav', password: 'pass035' },
  { username: 'meerajain', password: 'pass036' },
  { username: 'zarathakur', password: 'pass037' },
  { username: 'aisharanganathan', password: 'pass038' },
  { username: 'simrantrivedi', password: 'pass039' },
  { username: 'divyasaini', password: 'pass040' },
];

async function fixUsers() {
  console.log('🔧 Fixing auth users for existing profiles...\n');

  // First, delete all existing profiles (they have invalid UUIDs)
  console.log('🗑️  Clearing existing profiles...');
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.log('⚠️ Delete profiles error:', deleteError.message);
  } else {
    console.log('✅ Profiles cleared');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of USERS) {
    const email = `${user.username}@vsx.local`;
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true,
        user_metadata: { username: user.username }
      });

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('duplicate')) {
          console.log(`⏭️  Auth user ${user.username} exists, skipping...`);
          continue;
        }
        throw authError;
      }

      // Get the display name and role from original data
      const isAdmin = user.username === 'admin';
      const displayName = user.username === 'admin' ? 'Administrator' : 
        user.username.replace(/([a-z])([A-Z])/g, '$1 $2')
          .split(/(?=[A-Z])/).join(' ')
          .replace(/^./, c => c.toUpperCase());

      // Create profile with correct auth user ID
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: user.username,
          display_name: displayName,
          role: isAdmin ? 'admin' : 'participant',
          cash_balance: 100000000,
          starting_capital: 100000000,
        });

      if (profileError) {
        console.error(`❌ Profile error for ${user.username}:`, profileError.message);
        await supabase.auth.admin.deleteUser(authData.user.id);
        errorCount++;
        continue;
      }

      console.log(`✅ Created: ${user.username}`);
      successCount++;
      
      await new Promise(r => setTimeout(r, 50));
      
    } catch (err) {
      console.error(`❌ Error with ${user.username}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('========================================\n');

  console.log('📋 Login credentials:');
  console.log('   Admin: admin / admin123');
  console.log('   Users: aaravsharma / pass001, etc.');
}

fixUsers();
