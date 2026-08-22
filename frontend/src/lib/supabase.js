import { createClient } from '@supabase/supabase-js';

console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log(
  'Supabase key exists:',
  !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase environment variables are missing.');
}
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
