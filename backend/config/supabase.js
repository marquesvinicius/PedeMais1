const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || 'https://kecthdahzuzjoilfntiq.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3RoZGFoenV6am9pbGZudGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODE5NjEsImV4cCI6MjA2MTk1Nzk2MX0.3jFEYqQFr00hE4jmNtE7iZjXqbei5MgpVD_IRwiGKkw'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase } 