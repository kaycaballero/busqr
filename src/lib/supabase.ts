import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Revisa tu archivo .env o la configuración de Netlify.'
  )
}

export const supabase = createClient(url, anonKey)
