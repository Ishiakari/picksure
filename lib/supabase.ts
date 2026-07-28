import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://awydtgjgjvmpvgrcdtvd.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eWR0Z2pnanZtcHZncmNkdHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDQxNDksImV4cCI6MjEwMDEyMDE0OX0.9ifvpy7wdltdGZ8gLOIo87wouI3iWFABoXe-iaMGPcs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
