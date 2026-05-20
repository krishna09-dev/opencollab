import jwt, { Secret, SignOptions } from "jsonwebtoken";

const WEAK_JWT_SECRETS = new Set([
  "dev_secret",
  "super_secret_jwt_string",
  "replace_with_strong_secret"
]);

function getJwtSecret(): Secret {
  const jwtSecret = (process.env.JWT_SECRET || "").trim();
  if (!jwtSecret || WEAK_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      "JWT_SECRET is missing or weak. Generate a strong secret using: openssl rand -base64 48"
    );
  }
  return jwtSecret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN || "604800") as SignOptions["expiresIn"];
}

interface JwtPayloadInput {
  userId: string;
}

export function signUserJwt(payload: JwtPayloadInput): string {
  const signOptions: SignOptions = {
    expiresIn: getJwtExpiresIn()
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
