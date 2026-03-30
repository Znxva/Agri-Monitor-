import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qkhdufbhdunmkhdrgyxd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xIg2N1NGzYyKPD9hPGhdtQ_z5d7p-D0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
