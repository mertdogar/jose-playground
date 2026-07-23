import React, { useState, useEffect } from 'react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { detectAndParseToken, type DetectedTokenInfo } from '../../lib/jose/tokenDetector';
import { EXTERNAL_SAMPLE_TOKENS } from '../../lib/presets/sampleTokens';
import { ColorCodedToken } from '../common/ColorCodedToken';
import { verifyJwtToken, decryptJwe, verifyJws, generateDecoderCodeSnippet } from '../../lib/jose/joseHelpers';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Key,
  Terminal,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Lock,
  Unlock,
  Plus,
} from 'lucide-react';

interface DecoderWorkbenchProps {
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  onOpenInSandbox: (code: string) => void;
  onTransferToWorkbench: (
    tab: 'jwt' | 'jwe' | 'jws',
    data: {
      token: string;
      alg?: string;
      enc?: string;
      header?: any;
      payload?: any;
      secret?: string;
      keyId?: string;
    }
  ) => void;
}

export const DecoderWorkbench: React.FC<DecoderWorkbenchProps> = ({
  keys,
  onOpenKeyManager,
  onOpenInSandbox,
  onTransferToWorkbench,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(EXTERNAL_SAMPLE_TOKENS[0].token);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [rawSecret, setRawSecret] = useState<string>(EXTERNAL_SAMPLE_TOKENS[0].secretOrKeyHint || '');
  
  // Claim Override options for verification
  const [expectedIssuer, setExpectedIssuer] = useState<string>('');
  const [expectedAudience, setExpectedAudience] = useState<string>('');
  
  // Decoded token parsing result
  const [parsedToken, setParsedToken] = useState<DetectedTokenInfo>(() => detectAndParseToken(EXTERNAL_SAMPLE_TOKENS[0].token));

  // Verification / Decryption State
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const [decryptedPayloadStr, setDecryptedPayloadStr] = useState<string>('');
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  // Re-detect token on input change
  useEffect(() => {
    const info = detectAndParseToken(tokenInput);
    setParsedToken(info);
    setVerifyStatus('none');
    setVerifyMessage('');
    setDecryptedPayloadStr('');
  }, [tokenInput]);

  // Selected key object
  const currentKey = keys.find((k) => k.id === selectedKeyId);

  // Key Manager Selection Handler
  const handleSelectKeyFromManager = (keyId: string) => {
    setSelectedKeyId(keyId);
    if (!keyId) return;
    const k = keys.find((item) => item.id === keyId);
    if (k) {
      if (k.secretText) {
        setRawSecret(k.secretText);
      } else if (k.pemPrivate || k.pemPublic) {
        setRawSecret(k.pemPrivate || k.pemPublic || '');
      } else if (k.jwkPrivate || k.jwkPublic) {
        setRawSecret(JSON.stringify(k.jwkPrivate || k.jwkPublic, null, 2));
      }
    }
  };

  // Raw secret input change handler
  const handleRawSecretChange = (val: string) => {
    setRawSecret(val);
    if (selectedKeyId) {
      setSelectedKeyId('');
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    const preset = EXTERNAL_SAMPLE_TOKENS.find((p) => p.id === presetId);
    if (preset) {
      setTokenInput(preset.token);
      setSelectedKeyId('');
      if (preset.secretOrKeyHint) {
        setRawSecret(preset.secretOrKeyHint);
      } else {
        setRawSecret('');
      }
    }
  };

  // Perform Verification or Decryption
  const handleVerifyOrDecrypt = async () => {
    setVerifyStatus('none');
    setVerifyMessage('');
    setDecryptedPayloadStr('');

    if (!tokenInput.trim()) {
      setVerifyStatus('invalid');
      setVerifyMessage('Please enter or paste a valid JOSE token first.');
      return;
    }

    try {
      if (parsedToken.type === 'jwe-compact' || parsedToken.type === 'jwe-json') {
        // JWE Decryption
        const result = await decryptJwe(
          parsedToken.type === 'jwe-json' ? JSON.parse(tokenInput) : tokenInput,
          currentKey,
          rawSecret
        );
        setVerifyStatus('valid');
        setVerifyMessage('JWE Decrypted Successfully!');
        setDecryptedPayloadStr(result.plaintext);
      } else if (parsedToken.type === 'jws-json') {
        // JWS Verification
        const result = await verifyJws(JSON.parse(tokenInput), currentKey, rawSecret);
        setVerifyStatus('valid');
        setVerifyMessage('JWS Signature Verified Successfully!');
      } else {
        // JWT / JWS Compact Verification
        const result = await verifyJwtToken(tokenInput, currentKey, rawSecret, {
          issuer: expectedIssuer || undefined,
          audience: expectedAudience || undefined,
        });

        if (result.valid) {
          setVerifyStatus('valid');
          setVerifyMessage('JWT Signature & Claims Verified Successfully!');
        } else {
          setVerifyStatus('invalid');
          setVerifyMessage(result.error || 'Token verification failed.');
        }
      }
    } catch (err: any) {
      setVerifyStatus('invalid');
      setVerifyMessage(err.message || 'Verification / Decryption failed.');
    }
  };

  // Transfer decoded token to specific workbench
  const handleHandoff = () => {
    if (parsedToken.type === 'jwe-compact' || parsedToken.type === 'jwe-json') {
      onTransferToWorkbench('jwe', {
        token: tokenInput,
        alg: parsedToken.alg,
        enc: parsedToken.enc,
        header: parsedToken.protectedHeader,
        secret: rawSecret,
        keyId: selectedKeyId,
      });
    } else if (parsedToken.type === 'jws-compact' || parsedToken.type === 'jws-json') {
      onTransferToWorkbench('jws', {
        token: tokenInput,
        alg: parsedToken.alg,
        header: parsedToken.protectedHeader,
        payload: parsedToken.payload,
        secret: rawSecret,
        keyId: selectedKeyId,
      });
    } else {
      onTransferToWorkbench('jwt', {
        token: tokenInput,
        alg: parsedToken.alg,
        header: parsedToken.protectedHeader,
        payload: parsedToken.payload,
        secret: rawSecret,
        keyId: selectedKeyId,
      });
    }
  };

  // Open snippet in Sandbox
  const handleOpenSandboxSnippet = () => {
    const code = generateDecoderCodeSnippet(
      tokenInput,
      parsedToken.type,
      parsedToken.alg || 'HS256',
      currentKey,
      rawSecret
    );
    onOpenInSandbox(code);
  };

  // Save current secret to KeyManager
  const handleSaveAdhocKey = () => {
    if (!rawSecret.trim()) return;
    onOpenKeyManager();
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-900/20 via-indigo-900/10 to-transparent border border-violet-500/20 dark:border-violet-500/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Universal JOSE Token Decoder & Inspector
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Paste any external JOSE token (JWT, JWE, JWS, or JWK). The playground automatically detects its type, algorithm, and headers, inspects unencrypted payload claims, and provides tailored tools for signature verification or decryption.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Presets dropdown */}
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Load Sample Preset...
              </option>
              {EXTERNAL_SAMPLE_TOKENS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setTokenInput('');
                setRawSecret('');
              }}
              className="p-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Clear input"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Area (Left) & Inspector / Verification (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Token Input & Detection Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-4">
            {/* Input Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Raw Token Input
                </span>
              </div>

              {/* Type Badge */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-violet-100 dark:bg-violet-950/90 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                  {parsedToken.typeLabel}
                </span>

                {parsedToken.alg && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-100 dark:bg-cyan-950/90 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                    {parsedToken.alg}
                  </span>
                )}

                {parsedToken.enc && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {parsedToken.enc}
                  </span>
                )}
              </div>
            </div>

            {/* Claims Expiration Status Bar */}
            {parsedToken.claims && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Claims Status:</span>
                  </div>

                  {parsedToken.claims.isExpired ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/50">
                      <AlertCircle className="w-3 h-3" /> Expired ({parsedToken.claims.expiredAgo} ago)
                    </span>
                  ) : parsedToken.claims.isNotYetValid ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                      <Clock className="w-3 h-3" /> Not Active Yet (valid in {parsedToken.claims.validIn})
                    </span>
                  ) : parsedToken.claims.exp ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" /> Active / Valid Claim
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500">No exp claim</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  {parsedToken.claims.iss && (
                    <div className="truncate">
                      <span className="text-zinc-400 dark:text-zinc-500">iss:</span> {parsedToken.claims.iss}
                    </div>
                  )}
                  {parsedToken.claims.sub && (
                    <div className="truncate">
                      <span className="text-zinc-400 dark:text-zinc-500">sub:</span> {parsedToken.claims.sub}
                    </div>
                  )}
                  {parsedToken.claims.aud && (
                    <div className="truncate">
                      <span className="text-zinc-400 dark:text-zinc-500">aud:</span>{' '}
                      {Array.isArray(parsedToken.claims.aud)
                        ? parsedToken.claims.aud.join(', ')
                        : parsedToken.claims.aud}
                    </div>
                  )}
                  {parsedToken.claims.exp && (
                    <div className="truncate">
                      <span className="text-zinc-400 dark:text-zinc-500">exp:</span> {parsedToken.claims.exp}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error banner if unrecognized */}
            {parsedToken.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-mono">
                {parsedToken.error}
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste any JWT, JWE, JWS compact token or JSON object here..."
              rows={10}
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all shadow-inner resize-y"
            />

            {/* Actions: Handoff to workbench & Sandbox */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleHandoff}
                disabled={parsedToken.type === 'unknown'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  Open in {parsedToken.type.includes('jwe') ? 'JWE' : parsedToken.type.includes('jws') ? 'JWS' : 'JWT'} Workbench
                </span>
              </button>

              <button
                onClick={handleOpenSandboxSnippet}
                disabled={parsedToken.type === 'unknown'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Open Snippet in Sandbox</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Color Coded Breakdown, Inspectors & Verification Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Color Coded Token View for compact tokens */}
          {(parsedToken.type === 'jwt' || parsedToken.type === 'jws-compact' || parsedToken.type === 'jwe-compact') && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
              <ColorCodedToken
                token={tokenInput}
                type={parsedToken.type === 'jwe-compact' ? 'JWE' : parsedToken.type === 'jws-compact' ? 'JWS' : 'JWT'}
                hoveredPart={hoveredPart}
                onHoverPart={setHoveredPart}
              />
            </div>
          )}

          {/* Formatted Header & Payload JSON Inspectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Protected Header Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Protected Header
                  </span>
                </div>

                {parsedToken.headerJsonStr && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parsedToken.headerJsonStr || '');
                      setCopiedHeader(true);
                      setTimeout(() => setCopiedHeader(false), 2000);
                    }}
                    className="p-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    {copiedHeader ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 font-mono text-[11px] text-pink-600 dark:text-pink-400 overflow-x-auto max-h-56 border border-zinc-200/60 dark:border-zinc-800/60 shadow-inner">
                {parsedToken.headerJsonStr || '// No header detected'}
              </pre>
            </div>

            {/* Payload / Ciphertext Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      parsedToken.payloadType === 'encrypted' ? 'bg-purple-500' : 'bg-purple-400'
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {parsedToken.payloadType === 'encrypted' ? 'Ciphertext (Encrypted)' : 'Decoded Payload'}
                  </span>
                </div>

                {parsedToken.payloadJsonStr && parsedToken.payloadType !== 'encrypted' && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parsedToken.payloadJsonStr || '');
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }}
                    className="p-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {parsedToken.payloadType === 'encrypted' ? (
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Payload is Encrypted (JWE)</span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                    Provide the decryption key in the verification panel below to decrypt and reveal the plaintext content.
                  </p>
                </div>
              ) : (
                <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 font-mono text-[11px] text-purple-600 dark:text-purple-400 overflow-x-auto max-h-56 border border-zinc-200/60 dark:border-zinc-800/60 shadow-inner">
                  {parsedToken.payloadJsonStr || '// No payload'}
                </pre>
              )}
            </div>
          </div>

          {/* Verification & Decryption Control Panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  {parsedToken.type.includes('jwe') ? 'JWE Decryption Key' : 'Signature Verification Key'}
                </h3>
              </div>

              {parsedToken.alg && (
                <span className="text-[11px] font-mono text-zinc-500">
                  Detected Alg: <span className="font-bold text-violet-600 dark:text-violet-400">{parsedToken.alg}</span>
                </span>
              )}
            </div>

            {/* Key Selector & Adhoc Input */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select from KeyManager */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Select Key from Key Manager
                  </label>
                  <select
                    value={selectedKeyId}
                    onChange={(e) => handleSelectKeyFromManager(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">-- Custom Secret / Ad-hoc Key --</option>
                    {keys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.alg})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secret / Key Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Raw Secret / PEM / JWK Input
                    </label>
                    {!selectedKeyId && rawSecret && (
                      <button
                        onClick={handleSaveAdhocKey}
                        className="flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Save to Key Manager
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={rawSecret}
                    onChange={(e) => handleRawSecretChange(e.target.value)}
                    placeholder="Enter secret string, PEM or JWK..."
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Claims Overrides (Issuer & Audience verification for JWT) */}
              {parsedToken.type === 'jwt' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Expected Issuer (iss) Validation
                    </label>
                    <input
                      type="text"
                      value={expectedIssuer}
                      onChange={(e) => setExpectedIssuer(e.target.value)}
                      placeholder="Optional e.g. https://auth.example.com"
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Expected Audience (aud) Validation
                    </label>
                    <input
                      type="text"
                      value={expectedAudience}
                      onChange={(e) => setExpectedAudience(e.target.value)}
                      placeholder="Optional e.g. client_app_12345"
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* Verify / Decrypt Submit Button */}
              <button
                onClick={handleVerifyOrDecrypt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                {parsedToken.type.includes('jwe') ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Decrypt JWE Token</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Signature & Claims</span>
                  </>
                )}
              </button>

              {/* Verification Result Banner */}
              {verifyStatus === 'valid' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{verifyMessage}</span>
                  </div>

                  {decryptedPayloadStr && (
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Decrypted Plaintext Output:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-emerald-100/60 dark:bg-zinc-950 font-mono text-xs text-emerald-900 dark:text-emerald-200 overflow-x-auto">
                        {decryptedPayloadStr}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {verifyStatus === 'invalid' && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{verifyMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
