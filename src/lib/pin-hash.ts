// PBKDF2-SHA256 PIN verifier. Runs in the browser (offline sign-in) and on the
// server (online sign-in and the seed script mirrors it). Uses WebCrypto only.

export const PIN_ITERATIONS = 100_000;

const enc = new TextEncoder();

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(bytes as ArrayBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// Rejects PINs that are trivially guessable: one digit repeated, or a run of
// consecutive digits in either direction.
export function isWeakPin(pin: string): boolean {
  const d = pin.split('').map(Number);
  if (d.every((x) => x === d[0])) return true;
  const up = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  const down = d.every((x, i) => i === 0 || x === d[i - 1] - 1);
  return up || down;
}

export async function derivePinHash(pin: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PIN_ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

export function newPinSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function verifyPin(pin: string, saltHex: string, hashHex: string): Promise<boolean> {
  return (await derivePinHash(pin, saltHex)) === hashHex;
}
