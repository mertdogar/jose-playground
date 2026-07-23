import React, { useState, useEffect } from 'react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { createSignedJwt, verifyJwtToken, decodeJwtSafely, generateJwtCodeSnippet } from '../../lib/jose/joseHelpers';
import { ColorCodedToken } from '../common/ColorCodedToken';
import type { SamplePreset } from '../../lib/presets/sampleTokens';
import { SAMPLE_PRESETS } from '../../lib/presets/sampleTokens';
import { ShieldCheck, ShieldAlert, Sparkles, Key, Terminal } from 'lucide-react';

interface JwtWorkbenchProps {
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  onOpenInSandbox: (code: string) => void;
}

export const JwtWorkbench: React.FC<JwtWorkbenchProps> = ({
  keys,
  onOpenKeyManager,
  onOpenInSandbox,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys[0]?.id || '');
  const [rawSecret, setRawSecret] = useState<string>('super-secret-key-for-jose-playground-32bytes!');
  
  const [alg, setAlg] = useState('HS256');
  const [headerJson, setHeaderJson] = useState('{\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify(
      {
        sub: 'user_12345',
        name: 'Jane Doe',
        admin: true,
        iat: Math.floor(Date.now() / 1000),
      },
      null,
      2
    )
  );

  const [issuer, setIssuer] = useState('https://auth.example.com');
  const [subject, setSubject] = useState('user_12345');
  const [audience, setAudience] = useState('client_app_12345');
  const [expirationTime, setExpirationTime] = useState('2h');

  const [generatedToken, setGeneratedToken] = useState('');
  const [signError, setSignError] = useState('');

  // Verification State
  const [tokenToVerify, setTokenToVerify] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [decodedHeader, setDecodedHeader] = useState<any>(null);
  const [decodedPayload, setDecodedPayload] = useState<any>(null);
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  // Sync selected key algorithm
  const currentKey = keys.find((k) => k.id === selectedKeyId);

  useEffect(() => {
    if (currentKey) {
      setAlg(currentKey.alg);
    }
  }, [selectedKeyId, currentKey]);

  const handleSign = async () => {
    setSignError('');
    try {
      let parsedHeader = {};
      let parsedPayload = {};
      try {
        parsedHeader = JSON.parse(headerJson);
      } catch (e: any) {
        throw new Error('Invalid Header JSON: ' + e.message);
      }
      try {
        parsedPayload = JSON.parse(payloadJson);
      } catch (e: any) {
        throw new Error('Invalid Payload JSON: ' + e.message);
      }

      const jwt = await createSignedJwt(
        {
          header: parsedHeader,
          payload: parsedPayload,
          alg,
          issuer: issuer || undefined,
          subject: subject || undefined,
          audience: audience || undefined,
          expirationTime: expirationTime || undefined,
        },
        currentKey,
        rawSecret
      );

      setGeneratedToken(jwt);
      setTokenToVerify(jwt);
      performVerify(jwt);
    } catch (err: any) {
      setSignError(err.message || 'Signing failed');
    }
  };

  const performVerify = async (jwtString: string) => {
    if (!jwtString.trim()) {
      setVerifyStatus('none');
      setDecodedHeader(null);
      setDecodedPayload(null);
      return;
    }

    const decoded = decodeJwtSafely(jwtString);
    if (decoded.success) {
      setDecodedHeader(decoded.protectedHeader);
      setDecodedPayload(decoded.payload);
    }

    try {
      const result = await verifyJwtToken(jwtString, currentKey, rawSecret, {
        issuer: issuer || undefined,
        audience: audience || undefined,
        clockTolerance: 5,
      });

      if (result.valid) {
        setVerifyStatus('valid');
        setVerifyMessage('JWT signature and claims verified successfully.');
      } else {
        setVerifyStatus('invalid');
        setVerifyMessage(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setVerifyStatus('invalid');
      setVerifyMessage(err.message || 'Verification exception');
    }
  };

  const loadPreset = (preset: SamplePreset) => {
    setHeaderJson(JSON.stringify(preset.header, null, 2));
    setPayloadJson(JSON.stringify(preset.payload, null, 2));
    if (preset.alg) setAlg(preset.alg);
    setIssuer(preset.issuer || '');
    setSubject(preset.subject || '');
    setAudience(preset.audience || '');
    setExpirationTime(preset.expirationTime || '2h');
  };

  const handleOpenSandbox = () => {
    let parsedHeader = {};
    let parsedPayload = {};
    try {
      parsedHeader = JSON.parse(headerJson);
    } catch {}
    try {
      parsedPayload = JSON.parse(payloadJson);
    } catch {}

    const code = generateJwtCodeSnippet(
      {
        header: parsedHeader,
        payload: parsedPayload,
        alg,
        issuer: issuer || undefined,
        subject: subject || undefined,
        audience: audience || undefined,
        expirationTime: expirationTime || undefined,
      },
      currentKey,
      rawSecret
    );
    onOpenInSandbox(code);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Quick Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PRESETS.filter((p) => p.category === 'JWT' || p.category === 'DPoP').map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p)}
              className="px-3 py-1 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-950/60 text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-300 border border-zinc-300 dark:border-zinc-700/60 hover:border-violet-300 dark:hover:border-violet-700/60 rounded-lg transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}

          <button
            onClick={handleOpenSandbox}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-all cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5" />
            Open in Sandbox
          </button>
        </div>
      </div>

      {/* Main Grid: Encoder / Config & Visual Decoder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signer Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              1. Token & Key Configuration
            </h3>

            {/* Key Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none focus:border-violet-500"
              >
                <option value="">Custom Raw Key String</option>
                {keys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.alg})
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenKeyManager}
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Open Key Manager"
              >
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!currentKey && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Raw Secret / PEM Key
              </label>
              <input
                type="text"
                value={rawSecret}
                onChange={(e) => setRawSecret(e.target.value)}
                placeholder="Enter secret string or PEM"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {/* Algorithm & Claims input */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Alg</label>
              <select
                value={alg}
                onChange={(e) => setAlg(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="HS256">HS256</option>
                <option value="HS384">HS384</option>
                <option value="HS512">HS512</option>
                <option value="RS256">RS256</option>
                <option value="RS384">RS384</option>
                <option value="RS512">RS512</option>
                <option value="ES256">ES256</option>
                <option value="ES384">ES384</option>
                <option value="ES512">ES512</option>
                <option value="EdDSA">EdDSA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Issuer (iss)</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Audience (aud)</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="client_123"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Expires (exp)</label>
              <input
                type="text"
                value={expirationTime}
                onChange={(e) => setExpirationTime(e.target.value)}
                placeholder="2h, 7d"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Editors: Protected Header & Payload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-pink-600 dark:text-pink-400 mb-1">
                Protected Header (JSON)
              </label>
              <textarea
                rows={5}
                value={headerJson}
                onChange={(e) => setHeaderJson(e.target.value)}
                className="w-full p-3 text-xs font-mono rounded-xl bg-pink-50/50 dark:bg-zinc-950 border border-pink-200 dark:border-pink-900/40 text-pink-900 dark:text-pink-200 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                Payload / Claims (JSON)
              </label>
              <textarea
                rows={5}
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
                className="w-full p-3 text-xs font-mono rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-purple-900/40 text-purple-900 dark:text-purple-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {signError && (
            <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {signError}
            </div>
          )}

          <button
            onClick={handleSign}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/20 dark:shadow-violet-950/40"
          >
            Generate & Sign JWT Token
          </button>
        </div>

        {/* Right Column: Visual Token Decoder & Validator (5 cols) */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              2. Decoded JWT Breakdown
            </h3>

            {/* Verification Status Badge */}
            {verifyStatus === 'valid' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified
              </div>
            )}
            {verifyStatus === 'invalid' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Invalid
              </div>
            )}
          </div>

          <ColorCodedToken
            token={generatedToken || tokenToVerify}
            type="JWT"
            hoveredPart={hoveredPart}
            onHoverPart={setHoveredPart}
          />

          {verifyStatus === 'invalid' && (
            <div className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {verifyMessage}
            </div>
          )}

          {/* Decoded Header View */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              hoveredPart === 0
                ? 'bg-pink-100/80 dark:bg-pink-950/50 border-pink-500 scale-[1.01]'
                : 'bg-pink-50/40 dark:bg-zinc-950 border-pink-100 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-pink-600 dark:text-pink-400">Header</span>
              <span className="text-[10px] text-zinc-500 font-mono">Algorithm & Token Type</span>
            </div>
            <pre className="text-xs font-mono text-pink-800 dark:text-pink-200 overflow-x-auto whitespace-pre-wrap">
              {decodedHeader ? JSON.stringify(decodedHeader, null, 2) : '// Header JSON will appear here'}
            </pre>
          </div>

          {/* Decoded Payload View */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              hoveredPart === 1
                ? 'bg-purple-100/80 dark:bg-purple-950/50 border-purple-500 scale-[1.01]'
                : 'bg-purple-50/40 dark:bg-zinc-950 border-purple-100 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Payload Claims</span>
              <span className="text-[10px] text-zinc-500 font-mono">Standard & Custom Data</span>
            </div>
            <pre className="text-xs font-mono text-purple-800 dark:text-purple-200 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
              {decodedPayload ? JSON.stringify(decodedPayload, null, 2) : '// Payload claims JSON will appear here'}
            </pre>
          </div>

          {/* Signature View */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              hoveredPart === 2
                ? 'bg-cyan-100/80 dark:bg-cyan-950/50 border-cyan-500 scale-[1.01]'
                : 'bg-cyan-50/40 dark:bg-zinc-950 border-cyan-100 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Cryptographic Signature</span>
              <span className="text-[10px] text-zinc-500 font-mono">Verified with {alg}</span>
            </div>
            <p className="text-xs font-mono text-cyan-700 dark:text-cyan-300/80 break-all">
              {generatedToken ? generatedToken.split('.')[2] : '// Signature string'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
