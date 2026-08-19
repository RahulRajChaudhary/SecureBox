import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(credential) {
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
  } catch {
    throw new UnauthorizedError('Invalid Google credential');
  }

  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
  };
}
