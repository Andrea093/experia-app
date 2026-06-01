import { supabase } from './supabaseClient.js'

export async function bulkCreateUsers(users) {
  const { data, error } = await supabase.functions.invoke('bulk-create-users', {
    body: { users },
  })
  if (error) throw error
  return data.results
}
