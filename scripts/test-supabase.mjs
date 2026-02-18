// Test Supabase connection and auth
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check database connection
  console.log('1️⃣ Testing database connection...');
  const { data: profiles, error: dbError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (dbError) {
    console.log('❌ Database error:', dbError.message);
    console.log('\n👉 You may need to run sql/schema.sql first in Supabase SQL Editor');
  } else {
    console.log('✅ Database connection OK');
  }

  // Test 2: List existing users
  console.log('\n2️⃣ Listing existing auth users...');
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ Auth error:', authError.message);
    console.log('\n⚠️ This might indicate:');
    console.log('   - Project is paused (free tier)');
    console.log('   - Service role key is invalid');
    console.log('   - Auth service has issues');
  } else {
    console.log(`✅ Found ${users.users.length} existing users:`);
    users.users.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`);
    });
  }

  // Test 3: Try creating a single test user
  console.log('\n3️⃣ Attempting to create a test user...');
  const testEmail = `test_${Date.now()}@vsx.local`;
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'testpass123',
    email_confirm: true
  });

  if (createError) {
    console.log('❌ Create user error:', createError.message);
    console.log('\nFull error:', JSON.stringify(createError, null, 2));
  } else {
    console.log('✅ Successfully created test user:', newUser.user.email);
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(newUser.user.id);
    console.log('🧹 Cleaned up test user');
  }

  console.log('\n========================================');
  console.log('Test complete!');
}

test();
