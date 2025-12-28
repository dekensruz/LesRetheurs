
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yzreaesuberjvnpemguf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cmVhZXN1YmVyanZucGVtZ3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDQ3MTcsImV4cCI6MjA4MjQ4MDcxN30.DxyXMOzLFU2uXbU5IpiVFmIe2oqXR5D-TdQVuOqrDu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Note: This app assumes a table "posts" exists with the following columns:
// id (uuid), created_at (timestamptz), title (text), book_title (text), 
// book_author (text), content (text), user_name (text), category (text), ai_analysis (text)
