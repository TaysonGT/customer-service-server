import { createClient } from '@supabase/supabase-js'
import type { Request, Response } from 'express'


export function createSupabaseServerClient(req: Request, res: Response) {
  const token = req.headers.authorization?.split(' ')[1];
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}
