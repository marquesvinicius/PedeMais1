// supabase.js

const SUPABASE_URL = 'https://kecthdahzuzjoilfntiq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3RoZGFoenV6am9pbGZudGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODE5NjEsImV4cCI6MjA2MTk1Nzk2MX0.3jFEYqQFr00hE4jmNtE7iZjXqbei5MgpVD_IRwiGKkw' // essa é a anon key

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

