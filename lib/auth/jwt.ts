import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_change_in_production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  nome: string;
  plano: "free" | "pro";
}

export function gerarToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

export function verificarToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function obterUserIdDoToken(token: string): string | null {
  const payload = verificarToken(token);
  return payload ? payload.userId : null;
}

export function obterTokenDoHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}
