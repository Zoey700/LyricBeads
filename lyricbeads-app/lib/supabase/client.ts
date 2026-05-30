import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = 'https://obgupwnrfietechhttlo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ3Vwd25yZmlldGVjaGh0dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjc3MTQsImV4cCI6MjA5NDUwMzcxNH0.IxLTy4LJRECUNl49yvEs1lmQi7PZ5TbeRlk7blJFJxw'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'sb-obgupwnrfietechhttlo-auth-token',
      },
    })
  }
  return clientInstance
}
