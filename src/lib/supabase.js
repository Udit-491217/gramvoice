import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://anwpiaaibqdtdpbewkxv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud3BpYWFpYnFkdGRwYmV3a3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTA1NzMsImV4cCI6MjA5MDY4NjU3M30.VxbXIjZ3ZshJEjPzktK4h8P38dkLFXP91jZ1FQn3Jo0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)