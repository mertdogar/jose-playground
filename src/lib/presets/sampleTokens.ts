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

export interface ExternalSampleToken {
  id: string;
  name: string;
  description: string;
  token: string;
  secretOrKeyHint?: string;
}

export const EXTERNAL_SAMPLE_TOKENS: ExternalSampleToken[] = [
  {
    id: 'hs256-jwt',
    name: 'Standard HS256 JWT Token',
    description: 'Signed HMAC-SHA256 JWT token with secret: "super-secret-key-for-jose-playground-32bytes!"',
    secretOrKeyHint: 'super-secret-key-for-jose-playground-32bytes!',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJKb2huIERvZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3ODQ4MzM4MDksImV4cCI6MTc4NDg0MTAwOX0.J9J4K-dfNop1TFLRLW9YyyqQhyMrkm8zByiY2twUfmM',
  },
  {
    id: 'hs256-expired-jwt',
    name: 'Expired HS256 JWT Token',
    description: 'JWT token with exp timestamp set in the past for testing expiration claim validation.',
    secretOrKeyHint: 'super-secret-key-for-jose-playground-32bytes!',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJKb2huIERvZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3ODQ4MjM4MDksImV4cCI6MTc4NDgyODgwOX0.90JgkVCa3y7tP8Wjng45LWFqAOSBq-fhh2eSXFc4p7s',
  },
  {
    id: 'flattened-jws-json',
    name: 'Flattened JWS JSON Signature',
    description: 'JSON formatted JWS with detached/separated payload and signature fields.',
    secretOrKeyHint: 'super-secret-key-for-jose-playground-32bytes!',
    token: JSON.stringify(
      {
        payload: 'eyJpc3MiOiJqb2UiLCJleHAiOjEzMDA4MTkzODB9',
        protected: 'eyJhbGciOiJIUzI1NiJ9',
        signature: 'CA4Z3YR4SO2wmewNCZVn5Z_nAO2tImqF9KqA-l_lsUU',
      },
      null,
      2
    ),
  },
  {
    id: 'direct-jwe-token',
    name: 'Direct Encrypted JWE (dir + A256GCM)',
    description: 'Encrypted JWE using direct key algorithm (dir) and AES-256-GCM content encryption.',
    secretOrKeyHint: 'dev-only-insecure-shared-secret',
    token:
      'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..hDjMZFVGrOV5aEH3.douisnBVmJ0R5vy1TJ2KVDyVfHQT6jXNYjcq7lkbkbfsuxTefkCseVl2QkmOX-vPpCg6CxlCJnTub3Sou23Z5ut2UspibrynfJH9jschdhHv1U0qB6Ue63MoLxXM8rt2Ho-Gvdoa1j2i4Bz0Jt0xjMx5SQ4PnF1DVNtNI7aMOLGl4AXzSY3GAoKcFrNtyl-Gr9I9CeoH5OHvEm29L91QUITh2Yk9pyLf3IFou1fClll7uFe0N1P8hgVhsXruJXJtJAG1QLOWNfA.UA8QgdpQa4ARn2jGe3sr-w',
  },
  {
    id: 'example-jwk-set',
    name: 'JWK Set (JWKS) JSON',
    description: 'Public Key Set containing RSA and EC keys.',
    token: JSON.stringify(
      {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            alg: 'RS256',
            kid: 'key-2026-auth-01',
            n: 'u1W1gFWFOEjXk...',
            e: 'AQAB',
          },
          {
            kty: 'EC',
            crv: 'P-256',
            use: 'sig',
            alg: 'ES256',
            kid: 'ec-key-es256-v1',
            x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvMVEg',
            y: 'x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0',
          },
        ],
      },
      null,
      2
    ),
  },
];

