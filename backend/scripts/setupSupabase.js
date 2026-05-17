require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Bucket creation requires the SERVICE ROLE key, not the anon key.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const BUCKETS = [
  { name: 'avatars',              public: true  },
  { name: 'workspace-assets',     public: true  },
  { name: 'shared-files',         public: false },
  { name: 'project-backups',      public: false },
  { name: 'deployment-builds',    public: false },
  { name: 'workspace-media',      public: true  },
  { name: 'ai-generated-content', public: false },
];

(async () => {
  console.log('🪣  Creating Supabase storage buckets...\n');
  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
    });
    if (error && !error.message.includes('already exists')) {
      console.error(`  ✘ ${bucket.name}: ${error.message}`);
    } else {
      console.log(`  ✔ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    }
  }
  console.log('\n✅ Supabase storage ready!');
})();
