import type { JwtPayload, UserRole } from "../types";

const TOKEN_EXPIRY_SECONDS = 30 * 24 * 3600; // 30 days

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlDecode(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return base64UrlEncode(bytes);
}

export function base64UrlDecodeBytes(value: string): Uint8Array {
  return base64UrlDecode(value);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    stringToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds: number = TOKEN_EXPIRY_SECONDS,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(stringToBytes(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(stringToBytes(JSON.stringify(fullPayload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToBytes(dataToSign),
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const signatureBytes = base64UrlDecode(encodedSignature);

    const key = await getHmacKey(secret);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      stringToBytes(dataToSign),
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = bytesToString(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", stringToBytes(data));
  return bytesToHex(new Uint8Array(digest));
}

export async function sha256HexBytes(data: ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function derLength(length: number): Uint8Array {
  if (length < 128) return new Uint8Array([length]);
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function derSequence(...parts: Uint8Array[]): Uint8Array {
  const content = concatBytes(parts);
  return new Uint8Array([0x30, ...derLength(content.length), ...content]);
}

function derOctetString(content: Uint8Array): Uint8Array {
  return new Uint8Array([0x04, ...derLength(content.length), ...content]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  const rsaEncryptionOid = new Uint8Array([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
  return derSequence(
    new Uint8Array([0x02, 0x01, 0x00]),
    rsaEncryptionOid,
    derOctetString(pkcs1),
  );
}

export async function signRs256Jwt(
  payload: Record<string, unknown>,
  privateKeyPem: string,
): Promise<string> {
  const keyDer = privateKeyPem.includes("BEGIN PRIVATE KEY")
    ? pemToDer(privateKeyPem)
    : pkcs1ToPkcs8(pemToDer(privateKeyPem));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const body = base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

export async function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret?: string,
): Promise<boolean> {
  if (!secret) {
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  try {
    const expectedHex = signatureHeader.slice(7);
    const key = await getHmacKey(secret);
    const signature = await crypto.subtle.sign("HMAC", key, stringToBytes(rawBody));
    const actualHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time length & comparison check
    if (actualHex.length !== expectedHex.length) return false;
    let result = 0;
    for (let i = 0; i < actualHex.length; i++) {
      result |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

