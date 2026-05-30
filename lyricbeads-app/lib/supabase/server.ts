import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = 'https://obgupwnrfietechhttlo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ3Vwd25yZmlldGVjaGh0dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjc3MTQsImV4cCI6MjA5NDUwMzcxNH0.IxLTy4LJRECUNl49yvEs1lmQi7PZ5TbeRlk7blJFJxw'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
        }
      },
    },
  })
}
