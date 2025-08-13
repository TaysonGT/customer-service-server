import { Request, Response, NextFunction } from 'express';
import { createSupabaseServerClient } from './createSupabaseServerClient';

export interface AuthenticatedRequest extends Request {
  user: SessionUser
}

export interface SessionUser {
  id: string;
  sb_uid: string;
  email: string;
  role: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const supabase = createSupabaseServerClient(req, res);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
    return
  }

  req.user = {
    id: user.user_metadata?.id,
    sb_uid: user.id,
    email: user.email!,
    role: user.user_metadata?.role || 'client', // Assuming you store role in metadata
  };

  next();
};
