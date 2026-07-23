import * as jose from 'jose';

export type DetectedTokenType =
  | 'jwt'
  | 'jws-compact'
  | 'jwe-compact'
  | 'jws-json'
  | 'jwe-json'
  | 'jwk'
  | 'jwks'
  | 'unknown';

export interface TokenClaimsInfo {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  isExpired?: boolean;
  expiredAgo?: string;
  isNotYetValid?: boolean;
  validIn?: string;
}

export interface DetectedTokenInfo {
  type: DetectedTokenType;
  typeLabel: string;
  alg?: string;
  enc?: string;
  protectedHeader?: Record<string, any>;
  unprotectedHeader?: Record<string, any>;
  headerJsonStr?: string;
  payload?: any;
  payloadJsonStr?: string;
  payloadType?: 'json' | 'text' | 'encrypted';
  claims?: TokenClaimsInfo;
  parts: {
    headerB64?: string;
    payloadB64?: string;
    signatureB64?: string;
    encryptedKeyB64?: string;
    ivB64?: string;
    ciphertextB64?: string;
    tagB64?: string;
    aadB64?: string;
  };
  error?: string;
}

function base64UrlDecode(str: string): string {
  try {
    // Replace non-url compatible chars
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '='
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  } catch (e) {
    return str;
  }
}

function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${Math.round(abs)}s`;
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h`;
  return `${Math.round(abs / 86400)}d`;
}

export function detectAndParseToken(inputStr: string): DetectedTokenInfo {
  const trimmed = inputStr.trim();

  if (!trimmed) {
    return {
      type: 'unknown',
      typeLabel: 'Empty Input',
      parts: {},
    };
  }

  // 1. Check if input is JSON (JSON JWS/JWE, JWK, JWKS)
  if (trimmed.startsWith('{')) {
    try {
      const parsedJson = JSON.parse(trimmed);

      // Check JWKS
      if (Array.isArray(parsedJson.keys)) {
        return {
          type: 'jwks',
          typeLabel: 'JWK Set (JWKS)',
          payload: parsedJson,
          payloadJsonStr: JSON.stringify(parsedJson, null, 2),
          payloadType: 'json',
          parts: {},
        };
      }

      // Check Single JWK
      if (parsedJson.kty) {
        return {
          type: 'jwk',
          typeLabel: 'JSON Web Key (JWK)',
          alg: parsedJson.alg,
          payload: parsedJson,
          payloadJsonStr: JSON.stringify(parsedJson, null, 2),
          payloadType: 'json',
          parts: {},
        };
      }

      // Check JSON JWE (Flattened or General)
      if ('ciphertext' in parsedJson && ('encrypted_key' in parsedJson || 'recipients' in parsedJson)) {
        let protectedHeader: Record<string, any> = {};
        if (parsedJson.protected) {
          try {
            protectedHeader = JSON.parse(base64UrlDecode(parsedJson.protected));
          } catch (_) {}
        }
        const alg = protectedHeader.alg || parsedJson.unprotected?.alg;
        const enc = protectedHeader.enc || parsedJson.unprotected?.enc;

        return {
          type: 'jwe-json',
          typeLabel: parsedJson.recipients ? 'General JWE (JSON)' : 'Flattened JWE (JSON)',
          alg,
          enc,
          protectedHeader,
          unprotectedHeader: parsedJson.unprotected || parsedJson.header,
          headerJsonStr: JSON.stringify({ protected: protectedHeader, unprotected: parsedJson.unprotected }, null, 2),
          payloadType: 'encrypted',
          parts: {
            ciphertextB64: parsedJson.ciphertext,
            ivB64: parsedJson.iv,
            tagB64: parsedJson.tag,
            encryptedKeyB64: parsedJson.encrypted_key,
            aadB64: parsedJson.aad,
          },
        };
      }

      // Check JSON JWS (Flattened or General)
      if ('payload' in parsedJson && ('signatures' in parsedJson || 'signature' in parsedJson)) {
        let protectedHeader: Record<string, any> = {};
        const firstSig = parsedJson.signatures?.[0] || parsedJson;
        if (firstSig?.protected) {
          try {
            protectedHeader = JSON.parse(base64UrlDecode(firstSig.protected));
          } catch (_) {}
        }
        const alg = protectedHeader.alg || firstSig?.header?.alg;

        let decodedPayload: any = parsedJson.payload;
        let payloadJsonStr = '';
        let payloadType: 'json' | 'text' = 'text';

        try {
          const decodedRaw = base64UrlDecode(parsedJson.payload);
          try {
            decodedPayload = JSON.parse(decodedRaw);
            payloadJsonStr = JSON.stringify(decodedPayload, null, 2);
            payloadType = 'json';
          } catch (_) {
            decodedPayload = decodedRaw;
            payloadJsonStr = decodedRaw;
          }
        } catch (_) {}

        return {
          type: 'jws-json',
          typeLabel: parsedJson.signatures ? 'General JWS (JSON)' : 'Flattened JWS (JSON)',
          alg,
          protectedHeader,
          unprotectedHeader: firstSig?.header,
          headerJsonStr: JSON.stringify({ protected: protectedHeader, header: firstSig?.header }, null, 2),
          payload: decodedPayload,
          payloadJsonStr,
          payloadType,
          parts: {
            payloadB64: parsedJson.payload,
            signatureB64: firstSig?.signature,
          },
        };
      }
    } catch (_) {
      // Invalid JSON string fallback
    }
  }

  // 2. Check Compact Formats (JWT, JWS, JWE separated by dots)
  const parts = trimmed.split('.');

  // 3-part Compact Token: JWT or JWS
  if (parts.length === 3) {
    const [headerB64, payloadB64, signatureB64] = parts;
    let protectedHeader: Record<string, any> = {};
    let alg: string | undefined;

    try {
      protectedHeader = jose.decodeProtectedHeader(trimmed);
      alg = protectedHeader.alg;
    } catch (_) {
      try {
        protectedHeader = JSON.parse(base64UrlDecode(headerB64));
        alg = protectedHeader.alg;
      } catch (e: any) {
        return {
          type: 'unknown',
          typeLabel: 'Invalid 3-part Compact Token',
          error: `Could not parse protected header: ${e.message}`,
          parts: { headerB64, payloadB64, signatureB64 },
        };
      }
    }

    // Try decoding payload
    let decodedPayload: any = null;
    let payloadJsonStr = '';
    let payloadType: 'json' | 'text' = 'text';
    let claims: TokenClaimsInfo | undefined = undefined;

    try {
      const decodedRaw = base64UrlDecode(payloadB64);
      try {
        decodedPayload = JSON.parse(decodedRaw);
        payloadJsonStr = JSON.stringify(decodedPayload, null, 2);
        payloadType = 'json';

        // Extract JWT standard claims
        if (typeof decodedPayload === 'object' && decodedPayload !== null) {
          const now = Math.floor(Date.now() / 1000);
          const exp = typeof decodedPayload.exp === 'number' ? decodedPayload.exp : undefined;
          const nbf = typeof decodedPayload.nbf === 'number' ? decodedPayload.nbf : undefined;
          const iat = typeof decodedPayload.iat === 'number' ? decodedPayload.iat : undefined;

          let isExpired = false;
          let expiredAgo: string | undefined;
          let isNotYetValid = false;
          let validIn: string | undefined;

          if (exp !== undefined) {
            if (exp <= now) {
              isExpired = true;
              expiredAgo = formatDuration(now - exp);
            }
          }

          if (nbf !== undefined) {
            if (nbf > now) {
              isNotYetValid = true;
              validIn = formatDuration(nbf - now);
            }
          }

          claims = {
            iss: decodedPayload.iss,
            sub: decodedPayload.sub,
            aud: decodedPayload.aud,
            exp,
            nbf,
            iat,
            jti: decodedPayload.jti,
            isExpired,
            expiredAgo,
            isNotYetValid,
            validIn,
          };
        }
      } catch (_) {
        decodedPayload = decodedRaw;
        payloadJsonStr = decodedRaw;
      }
    } catch (_) {}

    const isJwt = protectedHeader.typ === 'JWT' || claims !== undefined || !!protectedHeader.alg;

    return {
      type: isJwt ? 'jwt' : 'jws-compact',
      typeLabel: isJwt ? 'JSON Web Token (JWT)' : 'Compact JWS Signature',
      alg,
      protectedHeader,
      headerJsonStr: JSON.stringify(protectedHeader, null, 2),
      payload: decodedPayload,
      payloadJsonStr,
      payloadType,
      claims,
      parts: {
        headerB64,
        payloadB64,
        signatureB64,
      },
    };
  }

  // 5-part Compact Token: JWE (Header.EncryptedKey.IV.Ciphertext.Tag)
  if (parts.length === 5) {
    const [headerB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64] = parts;
    let protectedHeader: Record<string, any> = {};
    let alg: string | undefined;
    let enc: string | undefined;

    try {
      protectedHeader = jose.decodeProtectedHeader(trimmed);
      alg = protectedHeader.alg;
      enc = protectedHeader.enc;
    } catch (_) {
      try {
        protectedHeader = JSON.parse(base64UrlDecode(headerB64));
        alg = protectedHeader.alg;
        enc = protectedHeader.enc;
      } catch (e: any) {
        return {
          type: 'unknown',
          typeLabel: 'Invalid 5-part JWE Token',
          error: `Could not parse JWE header: ${e.message}`,
          parts: { headerB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64 },
        };
      }
    }

    return {
      type: 'jwe-compact',
      typeLabel: 'Compact JWE (Encrypted Token)',
      alg,
      enc,
      protectedHeader,
      headerJsonStr: JSON.stringify(protectedHeader, null, 2),
      payloadType: 'encrypted',
      parts: {
        headerB64,
        encryptedKeyB64,
        ivB64,
        ciphertextB64,
        tagB64,
      },
    };
  }

  return {
    type: 'unknown',
    typeLabel: 'Unrecognized Token Format',
    error: 'Token format does not match JWT/JWS (3 parts), JWE (5 parts), or JSON JWS/JWE/JWK structures.',
    parts: {},
  };
}
