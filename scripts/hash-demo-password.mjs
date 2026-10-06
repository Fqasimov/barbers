// Prints a salt and hash for a seeded demo account, matching src/auth/crypto.ts.
// The password is passed on the command line and never written to the repo:
//   node scripts/hash-demo-password.mjs '<password>'
import { createHash, randomBytes } from 'node:crypto';

const ROUNDS = 1000;
const password = process.argv[2];
if (!password) {
  console.error('usage: node scripts/hash-demo-password.mjs <password>');
  process.exit(1);
}
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const salt = randomBytes(16).toString('hex');
let h = `${salt}:${password}`;
for (let i = 0; i < ROUNDS; i++) h = sha256(`${salt}:${h}`);
console.log(JSON.stringify({ salt, hash: h }));
