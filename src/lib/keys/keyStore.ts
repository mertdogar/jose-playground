import * as jose from 'jose';

export interface StoredKey {
  id: string;
  name: string;
  alg: string;
  type: 'symmetric' | 'asymmetric';
  use: 'sig' | 'enc';
  jwkPublic?: jose.JWK;
  jwkPrivate?: jose.JWK;
  pemPublic?: string;
  pemPrivate?: string;
  secretText?: string;
  createdAt: number;
}

const STORAGE_KEY = 'jose_playground_keys_v1';

export async function createDefaultKeys(): Promise<StoredKey[]> {
  try {
    // 1. HMAC Secret Key
    const hmacSecret = 'super-secret-key-for-jose-playground-32bytes!';
    const hmacJwk = await jose.exportJWK(new TextEncoder().encode(hmacSecret));
    hmacJwk.alg = 'HS256';
    hmacJwk.use = 'sig';

    // 2. EC P-256 Key Pair
    const ecKeys = await jose.generateKeyPair('ES256', { extractable: true });
    const ecPublicJwk = await jose.exportJWK(ecKeys.publicKey);
    const ecPrivateJwk = await jose.exportJWK(ecKeys.privateKey);
    const ecPublicPem = await jose.exportSPKI(ecKeys.publicKey);
    const ecPrivatePem = await jose.exportPKCS8(ecKeys.privateKey);

    // 3. Ed25519 Key Pair
    const edKeys = await jose.generateKeyPair('EdDSA', { extractable: true });
    const edPublicJwk = await jose.exportJWK(edKeys.publicKey);
    const edPrivateJwk = await jose.exportJWK(edKeys.privateKey);

    // 4. RSA Encryption Key Pair (RSA-OAEP-256)
    const rsaEncKeys = await jose.generateKeyPair('RSA-OAEP-256', { extractable: true });
    const rsaEncPublicJwk = await jose.exportJWK(rsaEncKeys.publicKey);
    const rsaEncPrivateJwk = await jose.exportJWK(rsaEncKeys.privateKey);
    const rsaEncPublicPem = await jose.exportSPKI(rsaEncKeys.publicKey);
    const rsaEncPrivatePem = await jose.exportPKCS8(rsaEncKeys.privateKey);

    return [
      {
        id: 'default-hs256',
        name: 'Default HMAC-SHA256 Secret',
        alg: 'HS256',
        type: 'symmetric',
        use: 'sig',
        jwkPrivate: hmacJwk,
        secretText: hmacSecret,
        createdAt: Date.now(),
      },
      {
        id: 'default-es256',
        name: 'Default EC P-256 Keypair',
        alg: 'ES256',
        type: 'asymmetric',
        use: 'sig',
        jwkPublic: ecPublicJwk,
        jwkPrivate: ecPrivateJwk,
        pemPublic: ecPublicPem,
        pemPrivate: ecPrivatePem,
        createdAt: Date.now() + 1,
      },
      {
        id: 'default-eddsa',
        name: 'Default Ed25519 (EdDSA) Keypair',
        alg: 'EdDSA',
        type: 'asymmetric',
        use: 'sig',
        jwkPublic: edPublicJwk,
        jwkPrivate: edPrivateJwk,
        createdAt: Date.now() + 2,
      },
      {
        id: 'default-rsa-oaep',
        name: 'Default RSA-OAEP-256 Enc Keypair',
        alg: 'RSA-OAEP-256',
        type: 'asymmetric',
        use: 'enc',
        jwkPublic: rsaEncPublicJwk,
        jwkPrivate: rsaEncPrivateJwk,
        pemPublic: rsaEncPublicPem,
        pemPrivate: rsaEncPrivatePem,
        createdAt: Date.now() + 3,
      },
    ];
  } catch (err) {
    console.error('Failed to create default keys:', err);
    return [];
  }
}

export function loadStoredKeys(): StoredKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading stored keys:', e);
    return [];
  }
}

export function saveStoredKeys(keys: StoredKey[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error('Error saving keys:', e);
  }
}

export async function generateNewKey(
  name: string,
  alg: string,
  use: 'sig' | 'enc'
): Promise<StoredKey> {
  const id = 'key-' + Math.random().toString(36).substring(2, 9);
  const createdAt = Date.now();

  if (alg.startsWith('HS') || alg.startsWith('A128') || alg.startsWith('A256') || alg === 'dir') {
    // Symmetric
    const secretKey = await jose.generateSecret(alg, { extractable: true });
    const jwk = await jose.exportJWK(secretKey);
    jwk.alg = alg;
    jwk.use = use;
    return {
      id,
      name,
      alg,
      type: 'symmetric',
      use,
      jwkPrivate: jwk,
      createdAt,
    };
  } else {
    // Asymmetric
    const keyPair = await jose.generateKeyPair(alg, { extractable: true });
    const publicJwk = await jose.exportJWK(keyPair.publicKey);
    const privateJwk = await jose.exportJWK(keyPair.privateKey);
    publicJwk.alg = alg;
    publicJwk.use = use;
    privateJwk.alg = alg;
    privateJwk.use = use;

    let pemPublic: string | undefined;
    let pemPrivate: string | undefined;
    try {
      pemPublic = await jose.exportSPKI(keyPair.publicKey);
      pemPrivate = await jose.exportPKCS8(keyPair.privateKey);
    } catch {
      // Some curve types may not export standard PKCS8 in all browser runtimes
    }

    return {
      id,
      name,
      alg,
      type: 'asymmetric',
      use,
      jwkPublic: publicJwk,
      jwkPrivate: privateJwk,
      pemPublic,
      pemPrivate,
      createdAt,
    };
  }
}
