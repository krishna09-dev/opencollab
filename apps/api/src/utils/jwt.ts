import jwt, { Secret, SignOptions } from "jsonwebtoken";

// Get JWT secret at runtime (after dotenv.config() has run)
function getJwtSecret(): Secret {
  return process.env.JWT_SECRET || "dev_secret";
}

// Get expiry at runtime
function getJwtExpiresIn(): number {
  return process.env.JWT_EXPIRES_IN
    ? Number(process.env.JWT_EXPIRES_IN)
    : 60 * 60 * 24 * 7; // 7 days
}

interface JwtPayloadInput {
  userId: string;
}

export function signUserJwt(payload: JwtPayloadInput): string {
  const signOptions: SignOptions = {
    expiresIn: getJwtExpiresIn(),
  };
  return jwt.sign(payload, getJwtSecret(), signOptions);
}

export function verifyUserJwt(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}