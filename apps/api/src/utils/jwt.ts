import jwt, { Secret, SignOptions } from "jsonwebtoken";

// Secret for signing JWT
const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev_secret";

// Expiry in SECONDS (default = 7 days)
const JWT_EXPIRES_IN: number = process.env.JWT_EXPIRES_IN
  ? Number(process.env.JWT_EXPIRES_IN)
  : 60 * 60 * 24 * 7; // 7 days

interface JwtPayloadInput {
  userId: string;
}

// Sign options using numeric expiry
const signOptions: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
};

export function signUserJwt(payload: JwtPayloadInput): string {
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyUserJwt(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}