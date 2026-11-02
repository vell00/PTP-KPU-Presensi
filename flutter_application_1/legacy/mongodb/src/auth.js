import {randomBytes, scrypt as rawScrypt, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(rawScrypt);
export async function hashPassword(password) {
  const salt=randomBytes(16).toString('hex');
  const hash=await scrypt(password,salt,64);
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [salt, hex]=encoded.split(':');
  const actual=await scrypt(password,salt,64);
  const expected=Buffer.from(hex,'hex');
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
