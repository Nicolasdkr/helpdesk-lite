import type { TokenPayload } from "../lib/jwt.js";

// Añade `req.user` al tipo Request de Express.
// Lo rellena el middleware `authenticate` tras validar el JWT.
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
