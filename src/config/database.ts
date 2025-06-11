import { createClient } from '@supabase/supabase-js'

// Replace these with YOUR Supabase details
const supabaseUrl = 'https://bxtudpgoevdpgiczxhfu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dHVkcGdvZXZkcGdpY3p4aGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODgxMzYsImV4cCI6MjA2NTE2NDEzNn0.o7d5i1E05mMs2qw82OxJAKhCQkEFPE-1OAxxKlB4PMw'

export const supabase = createClient(supabaseUrl, supabaseKey)