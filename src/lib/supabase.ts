import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://vqilivjthzulevnxytyg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxaWxpdmp0aHp1bGV2bnh5dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDQ0NTQsImV4cCI6MjA5Nzk4MDQ1NH0.dHEDqVKKvRZGrcR5qMClLZwzDg7_Z6XTirf0QMyj-_M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
