import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Check if required environment variables are available
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set in environment variables!')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables!')
}

// Create Supabase client with service role key for admin operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types (you can generate these with supabase gen types typescript)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number
          username: string | null
          first_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          username?: string | null
          first_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          username?: string | null
          first_name?: string | null
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          user_id: string
          topic: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          created_at?: string
        }
      }
    }
  }
} 