import * as jose from 'jose';
import type { StoredKey } from '../keys/keyStore';

export async function resolveJoseKey(
  keyObj: StoredKey | undefined,
  rawSecretOrPem: string,
  alg: string,
  mode: 'private' | 'public'
): Promise<jose.CryptoKey | Uint8Array | jose.KeyLike> {
  if (keyObj) {
    if (keyObj.type === 'symmetric') {
      if (keyObj.secretText) {
        return new TextEncoder().encode(keyObj.secretText);
      }
      if (keyObj.jwkPrivate) {
        return await jose.importJWK(keyObj.jwkPrivate, alg);
      }
    } else {
      const targetJwk = mode === 'private' ? keyObj.jwkPrivate : keyObj.jwkPublic || keyObj.jwkPrivate;
      if (targetJwk) {
        return await jose.importJWK(targetJwk, alg);
      }
      if (mode === 'private' && keyObj.pemPrivate) {
        return await jose.importPKCS8(keyObj.pemPrivate, alg);
      }
      if (mode === 'public' && keyObj.pemPublic) {
        return await jose.importSPKI(keyObj.pemPublic, alg);
      }
    }
  }

  // Fallback to raw string input
  const input = rawSecretOrPem.trim();
  if (!input) {
    throw new Error('No key or secret provided');
  }

  // Try parsing JSON JWK
  if (input.startsWith('{')) {
    try {
      const parsedJwk = JSON.parse(input);
      return await jose.importJWK(parsedJwk, alg);
    } catch (e: any) {
      throw new Error(`Invalid JWK JSON: ${e.message}`);
    }
  }

  // Try parsing PEM
  if (input.includes('-----BEGIN PRIVATE KEY-----')) {
    return await jose.importPKCS8(input, alg);
  }
  if (input.includes('-----BEGIN PUBLIC KEY-----')) {
    return await jose.importSPKI(input, alg);
  }

  // Raw secret string for symmetric algorithms
  return new TextEncoder().encode(input);
}

// ----------------------------------------------------
// JWT Helpers
// ----------------------------------------------------

export interface JwtSignOptions {
  payload: Record<string, any>;
  header: Record<string, any>;
  alg: string;
  issuer?: string;
  subject?: string;
  audience?: string | string[];
  expirationTime?: string; // e.g. "2h", "7d", "1721739999"
  notBefore?: string;
  jwtId?: string;
}

export async function createSignedJwt(
  options: JwtSignOptions,
  keyObj: StoredKey | undefined,
  rawKey: string
): Promise<string> {
  const key = await resolveJoseKey(keyObj, rawKey, options.alg, 'private');
  
  const signJwt = new jose.SignJWT(options.payload);
  
  // Custom or standard protected header
  const header = { alg: options.alg, ...options.header };
  signJwt.setProtectedHeader(header);

  if (options.issuer) signJwt.setIssuer(options.issuer);
  if (options.subject) signJwt.setSubject(options.subject);
  if (options.audience) signJwt.setAudience(options.audience);
  if (options.expirationTime) signJwt.setExpirationTime(options.expirationTime);
  if (options.notBefore) signJwt.setNotBefore(options.notBefore);
  if (options.jwtId) signJwt.setJti(options.jwtId);
  signJwt.setIssuedAt();

  return await signJwt.sign(key);
}

export interface JwtVerifyOptions {
  issuer?: string;
  audience?: string;
  clockTolerance?: number; // seconds
}

export async function verifyJwtToken(
  token: string,
  keyObj: StoredKey | undefined,
  rawKey: string,
  verifyOpts: JwtVerifyOptions
) {
  try {
    const protectedHeader = jose.decodeProtectedHeader(token);
    const alg = (protectedHeader.alg as string) || 'HS256';
    
    const key = await resolveJoseKey(keyObj, rawKey, alg, 'public');

    const options: jose.JWTVerifyOptions = {
      clockTolerance: verifyOpts.clockTolerance || 0,
    };
    if (verifyOpts.issuer) options.issuer = verifyOpts.issuer;
    if (verifyOpts.audience) options.audience = verifyOpts.audience;

    const result = await jose.jwtVerify(token, key, options);
    return {
      valid: true,
      payload: result.payload,
      protectedHeader: result.protectedHeader,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || 'JWT verification failed',
    };
  }
}

export function decodeJwtSafely(token: string) {
  try {
    const protectedHeader = jose.decodeProtectedHeader(token);
    const payload = jose.decodeJwt(token);
    return {
      success: true,
      protectedHeader,
      payload,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to decode token',
    };
  }
}

// ----------------------------------------------------
// JWE Helpers
// ----------------------------------------------------

export interface JweEncryptOptions {
  plaintext: string;
  alg: string; // Key management algorithm e.g. RSA-OAEP-256, ECDH-ES, A128KW, dir
  enc: string; // Content encryption alg e.g. A128GCM, A256GCM, A128CBC-HS256
  header?: Record<string, any>;
  format: 'compact' | 'json';
}

export async function encryptJwe(
  opts: JweEncryptOptions,
  keyObj: StoredKey | undefined,
  rawKey: string
): Promise<string | object> {
  const key = await resolveJoseKey(keyObj, rawKey, opts.alg, 'public');
  const encoder = new TextEncoder();
  const data = encoder.encode(opts.plaintext);

  const protectedHeader = { alg: opts.alg, enc: opts.enc, ...opts.header };

  if (opts.format === 'compact') {
    const compactEncrypt = new jose.CompactEncrypt(data).setProtectedHeader(protectedHeader);
    return await compactEncrypt.encrypt(key);
  } else {
    const generalEncrypt = new jose.GeneralEncrypt(data)
      .setProtectedHeader(protectedHeader)
      .addRecipient(key);
    return await generalEncrypt.encrypt();
  }
}

export async function decryptJwe(
  jweInput: string | object,
  keyObj: StoredKey | undefined,
  rawKey: string
): Promise<{ plaintext: string; protectedHeader: any }> {
  let header: any;
  if (typeof jweInput === 'string') {
    header = jose.decodeProtectedHeader(jweInput);
  } else {
    // JSON JWE
    const jsonObj = jweInput as any;
    header = typeof jsonObj.protected === 'string'
      ? JSON.parse(new TextDecoder().decode(jose.base64url.decode(jsonObj.protected)))
      : jsonObj.protected;
  }

  const alg = header?.alg || 'RSA-OAEP-256';
  const key = await resolveJoseKey(keyObj, rawKey, alg, 'private');

  let decryptResult: { plaintext: Uint8Array; protectedHeader: any };
  if (typeof jweInput === 'string') {
    decryptResult = await jose.compactDecrypt(jweInput, key);
  } else {
    decryptResult = await jose.generalDecrypt(jweInput as any, key);
  }

  return {
    plaintext: new TextDecoder().decode(decryptResult.plaintext),
    protectedHeader: decryptResult.protectedHeader,
  };
}

// ----------------------------------------------------
// JWS Helpers
// ----------------------------------------------------

export interface JwsSignOptions {
  payload: string;
  alg: string;
  header?: Record<string, any>;
  format: 'compact' | 'json';
}

export async function signJws(
  opts: JwsSignOptions,
  keyObj: StoredKey | undefined,
  rawKey: string
): Promise<string | object> {
  const key = await resolveJoseKey(keyObj, rawKey, opts.alg, 'private');
  const payloadBytes = new TextEncoder().encode(opts.payload);
  const protectedHeader = { alg: opts.alg, ...opts.header };

  if (opts.format === 'compact') {
    return await new jose.CompactSign(payloadBytes)
      .setProtectedHeader(protectedHeader)
      .sign(key);
  } else {
    return await new jose.GeneralSign(payloadBytes)
      .addSignature(key)
      .setProtectedHeader(protectedHeader)
      .sign();
  }
}

export async function verifyJws(
  jwsInput: string | object,
  keyObj: StoredKey | undefined,
  rawKey: string
): Promise<{ payload: string; protectedHeader: any }> {
  let header: any;
  if (typeof jwsInput === 'string') {
    header = jose.decodeProtectedHeader(jwsInput);
  } else {
    const jsonObj = jwsInput as any;
    header = typeof jsonObj.protected === 'string'
      ? JSON.parse(new TextDecoder().decode(jose.base64url.decode(jsonObj.protected)))
      : jsonObj.protected;
  }

  const alg = header?.alg || 'HS256';
  const key = await resolveJoseKey(keyObj, rawKey, alg, 'public');

  if (typeof jwsInput === 'string') {
    const result = await jose.compactVerify(jwsInput, key);
    return {
      payload: new TextDecoder().decode(result.payload),
      protectedHeader: result.protectedHeader,
    };
  } else {
    const result = await jose.generalVerify(jwsInput as any, key);
    return {
      payload: new TextDecoder().decode(result.payload),
      protectedHeader: result.protectedHeader,
    };
  }
}

// ----------------------------------------------------
// Code Snippet Generators
// ----------------------------------------------------

// ----------------------------------------------------
// Code Snippet Generators
// ----------------------------------------------------

export function generateJwtCodeSnippet(
  opts: JwtSignOptions,
  keyObj: StoredKey | undefined,
  rawSecret: string
): string {
  let keyInitCode = '';
  if (keyObj) {
    if (keyObj.type === 'symmetric') {
      if (keyObj.secretText) {
        keyInitCode = `const key = new TextEncoder().encode(${JSON.stringify(keyObj.secretText)});`;
      } else if (keyObj.jwkPrivate) {
        keyInitCode = `const key = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      }
    } else {
      if (keyObj.jwkPrivate) {
        keyInitCode = `const privateKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');
const publicKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPublic || keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      } else {
        keyInitCode = `const { privateKey, publicKey } = await jose.generateKeyPair('${opts.alg}');`;
      }
    }
  } else {
    keyInitCode = `const key = new TextEncoder().encode(${JSON.stringify(rawSecret || 'your-secret-key')});`;
  }

  const signKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'privateKey' : 'key';
  const verifyKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'publicKey' : 'key';

  return `import * as jose from 'jose';

// 1. Setup Key (${keyObj ? keyObj.name : 'Secret Key'})
${keyInitCode}

// 2. Build & Sign JWT
const jwt = await new jose.SignJWT(${JSON.stringify(opts.payload, null, 2)})
  .setProtectedHeader({ alg: '${opts.alg}'${opts.header && Object.keys(opts.header).length ? `, ...${JSON.stringify(opts.header)}` : ''} })
  .setIssuedAt()
${opts.issuer ? `  .setIssuer('${opts.issuer}')\n` : ''}${opts.subject ? `  .setSubject('${opts.subject}')\n` : ''}${opts.audience ? `  .setAudience('${opts.audience}')\n` : ''}${opts.expirationTime ? `  .setExpirationTime('${opts.expirationTime}')\n` : ''}  .sign(${signKeyVar});

console.log('Signed JWT Token:');
console.log(jwt);

// 3. Verify JWT Token
const { payload, protectedHeader } = await jose.jwtVerify(jwt, ${verifyKeyVar}${
    opts.issuer || opts.audience ? `, {\n${opts.issuer ? `  issuer: '${opts.issuer}',\n` : ''}${opts.audience ? `  audience: '${opts.audience}',\n` : ''}}` : ''
  });

console.log('Verified Protected Header:', protectedHeader);
console.log('Verified Claims Payload:', payload);
`;
}

export function generateJweCodeSnippet(
  opts: JweEncryptOptions,
  keyObj: StoredKey | undefined,
  rawSecret: string
): string {
  let keyInitCode = '';
  if (keyObj) {
    if (keyObj.type === 'symmetric') {
      if (keyObj.secretText) {
        keyInitCode = `const secretKey = new TextEncoder().encode(${JSON.stringify(keyObj.secretText)});`;
      } else if (keyObj.jwkPrivate) {
        keyInitCode = `const secretKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      }
    } else {
      if (keyObj.jwkPrivate) {
        keyInitCode = `const publicKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPublic || keyObj.jwkPrivate, null, 2)}, '${opts.alg}');
const privateKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      } else {
        keyInitCode = `const { publicKey, privateKey } = await jose.generateKeyPair('${opts.alg}');`;
      }
    }
  } else {
    keyInitCode = `const secretKey = new TextEncoder().encode(${JSON.stringify(rawSecret || 'your-secret-key')});`;
  }

  const encryptKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'publicKey' : 'secretKey';
  const decryptKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'privateKey' : 'secretKey';

  return `import * as jose from 'jose';

// 1. Setup Keys
${keyInitCode}

// 2. Encrypt JWE
const plaintext = ${JSON.stringify(opts.plaintext)};

${opts.format === 'compact' ? `const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(plaintext))
  .setProtectedHeader({ alg: '${opts.alg}', enc: '${opts.enc}'${opts.header && Object.keys(opts.header).length ? `, ...${JSON.stringify(opts.header)}` : ''} })
  .encrypt(${encryptKeyVar});

console.log('Encrypted JWE Token:');
console.log(jwe);

// 3. Decrypt JWE
const { plaintext: decryptedBytes, protectedHeader } = await jose.compactDecrypt(jwe, ${decryptKeyVar});

console.log('Decrypted Protected Header:', protectedHeader);
console.log('Decrypted Plaintext:', new TextDecoder().decode(decryptedBytes));` : `const jweObject = await new jose.GeneralEncrypt(new TextEncoder().encode(plaintext))
  .setProtectedHeader({ alg: '${opts.alg}', enc: '${opts.enc}'${opts.header && Object.keys(opts.header).length ? `, ...${JSON.stringify(opts.header)}` : ''} })
  .addRecipient(${encryptKeyVar})
  .encrypt();

console.log('Encrypted JWE General JSON Object:', jweObject);

const { plaintext: decryptedBytes, protectedHeader } = await jose.generalDecrypt(jweObject, ${decryptKeyVar});
console.log('Decrypted Plaintext:', new TextDecoder().decode(decryptedBytes));`}
`;
}

export function generateJwsCodeSnippet(
  opts: JwsSignOptions,
  keyObj: StoredKey | undefined,
  rawSecret: string
): string {
  let keyInitCode = '';
  if (keyObj) {
    if (keyObj.type === 'symmetric') {
      if (keyObj.secretText) {
        keyInitCode = `const key = new TextEncoder().encode(${JSON.stringify(keyObj.secretText)});`;
      } else if (keyObj.jwkPrivate) {
        keyInitCode = `const key = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      }
    } else {
      if (keyObj.jwkPrivate) {
        keyInitCode = `const privateKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPrivate, null, 2)}, '${opts.alg}');
const publicKey = await jose.importJWK(${JSON.stringify(keyObj.jwkPublic || keyObj.jwkPrivate, null, 2)}, '${opts.alg}');`;
      } else {
        keyInitCode = `const { privateKey, publicKey } = await jose.generateKeyPair('${opts.alg}');`;
      }
    }
  } else {
    keyInitCode = `const key = new TextEncoder().encode(${JSON.stringify(rawSecret || 'your-secret-key')});`;
  }

  const signKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'privateKey' : 'key';
  const verifyKeyVar = keyObj && keyObj.type === 'asymmetric' ? 'publicKey' : 'key';

  return `import * as jose from 'jose';

// 1. Setup Keys
${keyInitCode}

// 2. Sign JWS
const payload = ${JSON.stringify(opts.payload)};

${opts.format === 'compact' ? `const jws = await new jose.CompactSign(new TextEncoder().encode(payload))
  .setProtectedHeader({ alg: '${opts.alg}' })
  .sign(${signKeyVar});

console.log('Signed JWS:');
console.log(jws);

// 3. Verify JWS
const { payload: verifiedBytes, protectedHeader } = await jose.compactVerify(jws, ${verifyKeyVar});

console.log('Verified JWS Header:', protectedHeader);
console.log('Verified JWS Payload:', new TextDecoder().decode(verifiedBytes));` : `const jwsJson = await new jose.GeneralSign(new TextEncoder().encode(payload))
  .addSignature(${signKeyVar})
  .setProtectedHeader({ alg: '${opts.alg}' })
  .sign();

console.log('Signed JWS General JSON:', jwsJson);

const { payload: verifiedBytes, protectedHeader } = await jose.generalVerify(jwsJson, ${verifyKeyVar});
console.log('Verified Payload:', new TextDecoder().decode(verifiedBytes));`}
`;
}

