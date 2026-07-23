import React, { useState } from 'react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { Key, Code2, Download, Copy, Check, Hash, Globe, Terminal } from 'lucide-react';
import * as jose from 'jose';

interface JwkWorkbenchProps {
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  onOpenInSandbox: (code: string) => void;
}

export const JwkWorkbench: React.FC<JwkWorkbenchProps> = ({
  keys,
  onOpenKeyManager,
  onOpenInSandbox,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys[0]?.id || '');
  const [pemInput, setPemInput] = useState('');
  const [convertedJwk, setConvertedJwk] = useState<any>(null);
  const [convertError, setConvertError] = useState('');
  const [thumbprint, setThumbprint] = useState('');
  const [thumbprintUri, setThumbprintUri] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvertPemToJwk = async () => {
    setConvertError('');
    setConvertedJwk(null);
    setThumbprint('');
    setThumbprintUri('');

    if (!pemInput.trim()) {
      setConvertError('Please enter a PEM string');
      return;
    }

    try {
      let keyObject: jose.CryptoKey | Uint8Array;
      if (pemInput.includes('PUBLIC KEY')) {
        keyObject = await jose.importSPKI(pemInput, 'RS256');
      } else if (pemInput.includes('PRIVATE KEY')) {
        keyObject = await jose.importPKCS8(pemInput, 'RS256');
      } else {
        throw new Error('Unsupported PEM format. Must contain BEGIN PUBLIC KEY or BEGIN PRIVATE KEY header');
      }

      const jwk = await jose.exportJWK(keyObject);
      setConvertedJwk(jwk);

      const tp = await jose.calculateJwkThumbprint(jwk);
      const tpUri = await jose.calculateJwkThumbprintUri(jwk);
      setThumbprint(tp);
      setThumbprintUri(tpUri);
    } catch (err: any) {
      setConvertError(err.message || 'Conversion failed');
    }
  };

  // Build combined JWKS from all public stored keys
  const jwksObject = {
    keys: keys
      .map((k) => k.jwkPublic || k.jwkPrivate)
      .filter((jwk): jwk is jose.JWK => Boolean(jwk))
      .map((jwk) => {
        const { d, p, q, dp, dq, qi, ...pub } = jwk as any;
        return pub;
      }),
  };

  const handleCopyJwks = () => {
    navigator.clipboard.writeText(JSON.stringify(jwksObject, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSandbox = () => {
    const code = `import * as jose from 'jose';

// Public JWKS object from your stored keys
const jwks = ${JSON.stringify(jwksObject, null, 2)};

// Create a local JWKS Set matcher
const JWKS = jose.createLocalJWKSet(jwks);

console.log('Local JWKS Set initialized with', jwks.keys.length, 'public key(s).');
`;
    onOpenInSandbox(code);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JWK & JWKS Tools</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Convert PEM to JWK, calculate SHA-256 JWK thumbprints & build JWKS endpoints</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSandbox}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5" />
            Open in Sandbox
          </button>

          <button
            onClick={onOpenKeyManager}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Key Manager
          </button>
        </div>
      </div>

      {/* Grid: PEM Converter & JWKS Endpoint Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: PEM to JWK & Thumbprint (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              1. PEM to JWK Converter
            </h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
              PEM String (PKCS#8 / SPKI)
            </label>
            <textarea
              rows={6}
              value={pemInput}
              onChange={(e) => setPemInput(e.target.value)}
              placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
              className="w-full p-3 text-xs font-mono rounded-xl bg-amber-50/40 dark:bg-zinc-950 border border-amber-200 dark:border-zinc-800 text-amber-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {convertError && (
            <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {convertError}
            </div>
          )}

          <button
            onClick={handleConvertPemToJwk}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 dark:shadow-amber-950/40"
          >
            Convert PEM to JWK
          </button>

          {convertedJwk && (
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-zinc-950 border border-amber-200 dark:border-amber-500/40 space-y-2">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-400">Converted JWK Object:</div>
                <pre className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-amber-900 dark:text-amber-200 overflow-x-auto whitespace-pre-wrap border border-amber-200 dark:border-zinc-800">
                  {JSON.stringify(convertedJwk, null, 2)}
                </pre>
              </div>

              {thumbprint && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>JWK SHA-256 Thumbprint:</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-800 dark:text-zinc-400 break-all">{thumbprint}</p>
                  <p className="text-[10px] font-mono text-zinc-500 break-all">{thumbprintUri}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: JWKS Set Generator (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              2. JWKS Set Endpoint JSON
            </h3>

            <button
              onClick={handleCopyJwks}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied JWKS' : 'Copy JWKS'}
            </button>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Combined public keys from your Key Manager ready to serve at <code className="text-violet-600 dark:text-violet-400 font-mono">/.well-known/jwks.json</code>:
          </p>

          <pre className="h-[430px] p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs overflow-y-auto text-violet-900 dark:text-violet-300">
            {JSON.stringify(jwksObject, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
