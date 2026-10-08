// Read the JWT secret from the environment. The fallback only exists so that
// local development and tests keep working without a prepared .env file.
export const jwtSecret = process.env.JWT_SECRET ?? 'change-me-in-production';
export const roundsOfHashing = 10;
