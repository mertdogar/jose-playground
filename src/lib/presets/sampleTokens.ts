export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  category: 'JWT' | 'JWE' | 'JWS' | 'DPoP';
  alg: string;
  enc?: string;
  header: Record<string, any>;
  payload: Record<string, any> | string;
  expirationTime?: string;
  issuer?: string;
  audience?: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'oidc-id-token',
    name: 'OIDC ID Token (RS256)',
    description: 'Standard OpenID Connect ID token containing user profile claims and authentication details.',
    category: 'JWT',
    alg: 'RS256',
    header: {
      typ: 'JWT',
      kid: 'key-2026-auth-01',
    },
    payload: {
      iss: 'https://auth.example.com',
      sub: 'user_9847291048',
      aud: 'client_app_12345',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      email_verified: true,
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      auth_time: Math.floor(Date.now() / 1000) - 300,
      nonce: 'n-0S6_WzA2Mj',
    },
    expirationTime: '2h',
    issuer: 'https://auth.example.com',
    audience: 'client_app_12345',
  },
  {
    id: 'oauth-access-token',
    name: 'OAuth 2.0 Access Token (ES256)',
    description: 'Elliptic Curve (P-256) signed access token with scope permissions and client context.',
    category: 'JWT',
    alg: 'ES256',
    header: {
      typ: 'at+jwt',
      kid: 'ec-key-es256-v1',
    },
    payload: {
      iss: 'https://api.gateway.example.com',
      sub: 'client_service_backend',
      aud: 'https://resource.api.com/v1',
      client_id: 'client_app_12345',
      scope: 'read:users write:orders admin:access',
      roles: ['editor', 'api_client'],
      tenant_id: 'tenant_acme_corp',
    },
    expirationTime: '1h',
    issuer: 'https://api.gateway.example.com',
    audience: 'https://resource.api.com/v1',
  },
  {
    id: 'dpop-proof',
    name: 'OAuth 2.0 DPoP Proof Token (EdDSA / Ed25519)',
    description: 'Demonstration of Proof-of-Possession (DPoP) HTTP request binding token using Ed25519 key.',
    category: 'DPoP',
    alg: 'EdDSA',
    header: {
      typ: 'dpop+jwt',
      jwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
      },
    },
    payload: {
      htm: 'POST',
      htu: 'https://resource.example.org/protectedresource',
      jti: 'fWn0q7t_K9Z8',
      iat: Math.floor(Date.now() / 1000),
    },
    expirationTime: '5m',
  },
  {
    id: 'encrypted-payload-jwe',
    name: 'Confidential Payload JWE (RSA-OAEP-256 + A256GCM)',
    description: 'Encrypted JSON Web Encryption token securing sensitive payment parameters.',
    category: 'JWE',
    alg: 'RSA-OAEP-256',
    enc: 'A256GCM',
    header: {
      cty: 'json',
      zip: 'DEF',
    },
    payload: JSON.stringify({
      cardNumber: '4532-xxxx-xxxx-8892',
      cardHolder: 'Jane Doe',
      cvv: '982',
      amount: 149.99,
      currency: 'USD',
    }, null, 2),
  },
];
