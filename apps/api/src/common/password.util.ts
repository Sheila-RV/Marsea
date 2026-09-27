import * as argon2 from 'argon2';

export function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword);
}

export function verifyPassword(
  hash: string,
  plainPassword: string,
): Promise<boolean> {
  return argon2.verify(hash, plainPassword);
}
