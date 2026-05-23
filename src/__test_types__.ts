import { createClient } from '@supabase/supabase-js'
import type { Database } from './lib/supabase/types'

const c = createClient<Database>('url', 'key')
// Verify from('bookings') resolves to a typed query, not `never`
const _q = c.from('bookings').select('id, estado')
export type BookingQuery = typeof _q
