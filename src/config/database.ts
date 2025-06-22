import { createClient } from '@supabase/supabase-js'

// Replace these with YOUR Supabase details
const supabaseUrl = 'https://dxdshzscuxeqmhugilxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZHNoenNjdXhlcW1odWdpbHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODE4NzUsImV4cCI6MjA2NTg1Nzg3NX0.-FHqIaupcjLnl6aVoezOLKm5CRPzHICH1AI1zfG-M-M'


export const supabase = createClient(supabaseUrl, supabaseKey)