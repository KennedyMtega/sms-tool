import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Credentials = {
  sender_id: string
  api_key: string
}

export async function getUserCredentials(): Promise<{ credentials: Credentials }> {
  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('sender_id, api_key')
    .single()

  if (error) {
    console.error('Error fetching credentials:', error)
    return {
      credentials: {
        sender_id: 'N-SMS',
        api_key: ''
      }
    }
  }

  // Ensure sender_id is always a string
  const sender_id = settings?.sender_id || 'N-SMS'
  const api_key = settings?.api_key || ''

  return {
    credentials: {
      sender_id,
      api_key
    }
  }
} 