import { hash } from "@node-rs/argon2";
async function main() { const password = process.argv[2]; if (!password || password.length < 12) { console.error("Usage: npm run admin:hash -- <password-of-at-least-12-characters>"); process.exit(1); } console.log(await hash(password)); }
void main();
