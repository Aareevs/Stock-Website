// ===========================================
// VSX: Buy or Bail — Cleanup Orphaned Auth Users
// Run: node scripts/cleanup-orphaned-users.mjs
// ===========================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmaeiptjypsdjwrixjaw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYWVpcHRqeXBzZGp3cml4amF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQwNzIzMSwiZXhwIjoyMDg2OTgzMjMxfQ.wcrJ67_8YSzYrsMXWztn9lGvTTz3OHVWFGe6HnhibME';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOrphanedAuthUsers() {
  console.log('🧹 Starting cleanup of orphaned auth users...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers();
    if (authListError) throw authListError;

    console.log(`📋 Found ${authUsers?.users?.length || 0} total auth users`);

    // Get all profile IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    if (profilesError) throw profilesError;

    const profileIds = new Set((profiles || []).map(p => p.id));
    console.log(`📋 Found ${profileIds.size} profiles`);

    // Find orphaned auth users (auth users without profiles)
    const orphanedUsers = (authUsers?.users || []).filter(
      authUser => !profileIds.has(authUser.id)
    );

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned auth users found. Database is clean!');
      return;
    }

    console.log(`\n⚠️  Found ${orphanedUsers.length} orphaned auth users:`);
    orphanedUsers.forEach(user => {
      const email = user.email || 'no-email';
      const username = user.user_metadata?.username || email.split('@')[0];
      console.log(`   - ${username} (${user.id})`);
    });

    console.log('\n🗑️  Deleting orphaned auth users...\n');

    let deletedCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          const email = user.email || 'no-email';
          const username = user.user_metadata?.username || email.split('@')[0];
          console.error(`❌ Failed to delete ${username}:`, deleteError.message);
          errorCount++;
        } else {
          const email = user.email || 'no-email';
          const username = user.user_metadata?.username || email.split('@')[0];
          console.log(`✅ Deleted: ${username}`);
          deletedCount++;
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        const email = user.email || 'no-email';
        const username = user.user_metadata?.username || email.split('@')[0];
        console.error(`❌ Error deleting ${username}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Successfully deleted: ${deletedCount} orphaned auth users`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
}

// Check if SERVICE_ROLE_KEY is set
if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: You must set your SERVICE_ROLE_KEY!');
  console.error('\n📋 How to get it:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Project Settings → API');
  console.error('4. Copy the "service_role" key (secret)');
  console.error('5. Paste it in this script (line 6)\n');
  process.exit(1);
}

cleanupOrphanedAuthUsers();
