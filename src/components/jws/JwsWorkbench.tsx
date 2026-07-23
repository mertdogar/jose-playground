import React, { useState, useEffect } from 'react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { signJws, verifyJws, generateJwsCodeSnippet } from '../../lib/jose/joseHelpers';
import { ColorCodedToken } from '../common/ColorCodedToken';
import { FileSignature, ShieldCheck, ShieldAlert, Key, Terminal } from 'lucide-react';

interface JwsWorkbenchProps {
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  onOpenInSandbox: (code: string) => void;
}

export const JwsWorkbench: React.FC<JwsWorkbenchProps> = ({
  keys,
  onOpenKeyManager,
  onOpenInSandbox,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys[0]?.id || '');
  const [rawSecret, setRawSecret] = useState<string>('super-secret-key-for-jose-playground-32bytes!');

  const [alg, setAlg] = useState('HS256');
  const [format, setFormat] = useState<'compact' | 'json'>('compact');
  const [payloadText, setPayloadText] = useState('Arbitrary raw payload string or binary content to sign');

  const [signedOutput, setSignedOutput] = useState<any>('');
  const [signError, setSignError] = useState('');

  // Verification State
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifiedPayloadText, setVerifiedPayloadText] = useState('');
  const [verifiedHeader, setVerifiedHeader] = useState<any>(null);
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  const currentKey = keys.find((k) => k.id === selectedKeyId);

  useEffect(() => {
    if (currentKey) {
      setAlg(currentKey.alg);
    }
  }, [selectedKeyId, currentKey]);

  const handleSign = async () => {
    setSignError('');
    try {
      const output = await signJws(
        {
          payload: payloadText,
          alg,
          format,
        },
        currentKey,
        rawSecret
      );

      setSignedOutput(output);
      if (typeof output === 'string') {
        setVerifyInput(output);
        performVerify(output);
      } else {
        const jsonStr = JSON.stringify(output, null, 2);
        setVerifyInput(jsonStr);
        performVerify(jsonStr);
      }
    } catch (err: any) {
      setSignError(err.message || 'Signing failed');
    }
  };

  const performVerify = async (inputStr: string) => {
    if (!inputStr.trim()) {
      setVerifyStatus('none');
      setVerifiedPayloadText('');
      setVerifiedHeader(null);
      setVerifyMessage('');
      return;
    }

    try {
      let jwsInput: any = inputStr.trim();
      if (inputStr.trim().startsWith('{')) {
        try {
          jwsInput = JSON.parse(inputStr);
        } catch {}
      }

      const result = await verifyJws(jwsInput, currentKey, rawSecret);
      if (result.valid) {
        setVerifyStatus('valid');
        setVerifiedPayloadText(result.payloadText);
        setVerifiedHeader(result.protectedHeader);
        setVerifyMessage('JWS signature verified successfully.');
      } else {
        setVerifyStatus('invalid');
        setVerifiedPayloadText('');
        setVerifiedHeader(null);
        setVerifyMessage(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setVerifyStatus('invalid');
      setVerifiedPayloadText('');
      setVerifiedHeader(null);
      setVerifyMessage(err.message || 'Verification failed');
    }
  };

  const handleOpenSandbox = () => {
    const code = generateJwsCodeSnippet(
      {
        payload: payloadText,
        alg,
        format,
      },
      currentKey,
      rawSecret
    );
    onOpenInSandbox(code);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JWS JSON Web Signature</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sign arbitrary payload string or bytes with Compact or General JSON JWS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSandbox}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5" />
            Open in Sandbox
          </button>

          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none focus:border-violet-500"
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
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Open Key Manager"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!currentKey && (
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Raw Secret / PEM Key</label>
          <input
            type="text"
            value={rawSecret}
            onChange={(e) => setRawSecret(e.target.value)}
            placeholder="Enter secret string or PEM"
            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}

      {/* Grid: JWS Signer & Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signer (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              1. Sign Payload
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Algorithm (alg)</label>
              <select
                value={alg}
                onChange={(e) => setAlg(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="HS256">HS256</option>
                <option value="HS384">HS384</option>
                <option value="HS512">HS512</option>
                <option value="RS256">RS256</option>
                <option value="ES256">ES256</option>
                <option value="EdDSA">EdDSA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">JWS Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="compact">Compact (header.payload.sig)</option>
                <option value="json">General JWS JSON</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Raw Payload Text / Content</label>
            <textarea
              rows={6}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-xl bg-cyan-50/50 dark:bg-zinc-950 border border-cyan-200 dark:border-cyan-900/40 text-cyan-900 dark:text-cyan-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {signError && (
            <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {signError}
            </div>
          )}

          <button
            onClick={handleSign}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20 dark:shadow-cyan-950/40"
          >
            Sign JWS
          </button>
        </div>

        {/* Right Column: Verifier & Visual Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              2. Verify JWS Signature
            </h3>
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

          {typeof signedOutput === 'string' && signedOutput && (
            <ColorCodedToken
              token={signedOutput}
              type="JWS"
              hoveredPart={hoveredPart}
              onHoverPart={setHoveredPart}
            />
          )}

          {typeof signedOutput === 'object' && signedOutput && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-cyan-800 dark:text-cyan-300 overflow-x-auto">
              <pre>{JSON.stringify(signedOutput, null, 2)}</pre>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">JWS Input String or JSON</label>
            <textarea
              rows={4}
              value={verifyInput}
              onChange={(e) => {
                setVerifyInput(e.target.value);
                performVerify(e.target.value);
              }}
              placeholder="Paste Compact JWS string (3 parts) or JSON signature object"
              className="w-full p-3 text-xs font-mono rounded-xl bg-cyan-50/50 dark:bg-zinc-950 border border-cyan-200 dark:border-cyan-900/40 text-cyan-900 dark:text-cyan-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {verifyStatus === 'invalid' && (
            <div className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {verifyMessage}
            </div>
          )}

          {verifiedPayloadText && (
            <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 space-y-2">
              <div className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                Verified Payload Content:
              </div>
              <pre className="p-3 bg-white dark:bg-zinc-950 rounded-lg font-mono text-xs text-cyan-900 dark:text-cyan-200 overflow-x-auto whitespace-pre-wrap border border-cyan-200 dark:border-cyan-900/40">
                {verifiedPayloadText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
