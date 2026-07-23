import React, { useState, useEffect } from 'react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { encryptJwe, decryptJwe, generateJweCodeSnippet } from '../../lib/jose/joseHelpers';
import { ColorCodedToken } from '../common/ColorCodedToken';
import { Lock, Unlock, Key, CheckCircle2, AlertCircle, Edit3, Terminal } from 'lucide-react';

interface JweWorkbenchProps {
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  onOpenInSandbox: (code: string) => void;
}

export const JweWorkbench: React.FC<JweWorkbenchProps> = ({
  keys,
  onOpenKeyManager,
  onOpenInSandbox,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys[0]?.id || '');
  const [rawSecret, setRawSecret] = useState<string>('super-secret-key-for-jose-playground-32bytes!');

  const [alg, setAlg] = useState('RSA-OAEP-256');
  const [enc, setEnc] = useState('A256GCM');
  const [format, setFormat] = useState<'compact' | 'json'>('compact');
  const [customHeaderJson, setCustomHeaderJson] = useState('{\n  "cty": "json"\n}');

  const [plaintext, setPlaintext] = useState(
    JSON.stringify(
      {
        message: 'Top Secret Confidential Information',
        account: 'ACC-89471920',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const [encryptedOutput, setEncryptedOutput] = useState<any>('');
  const [encryptError, setEncryptError] = useState('');

  // Decryption State
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptedHeader, setDecryptedHeader] = useState<any>(null);
  const [decryptError, setDecryptError] = useState('');
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  // 5 JWE Segment Parts for interactive tamper/editing
  const [jweParts, setJweParts] = useState<string[]>(['', '', '', '', '']);

  const currentKey = keys.find((k) => k.id === selectedKeyId);

  // Determine allowed key algorithms for auto-selecting supported algs
  const isRsaKey = currentKey?.kty === 'RSA';
  const isEcKey = currentKey?.kty === 'EC' || currentKey?.kty === 'OKP';
  const isSymmetricKey = currentKey?.kty === 'oct';
  const noKeySelected = !currentKey;

  useEffect(() => {
    if (currentKey) {
      if (isRsaKey) {
        setAlg('RSA-OAEP-256');
      } else if (isEcKey) {
        setAlg('ECDH-ES');
      } else if (isSymmetricKey) {
        setAlg('A128KW');
      }
    }
  }, [selectedKeyId, currentKey]);

  const handleEncrypt = async () => {
    setEncryptError('');
    try {
      let parsedHeader = {};
      if (customHeaderJson.trim()) {
        try {
          parsedHeader = JSON.parse(customHeaderJson);
        } catch (e: any) {
          throw new Error('Invalid Custom Header JSON: ' + e.message);
        }
      }

      const jwe = await encryptJwe(
        {
          plaintext,
          alg,
          enc,
          header: parsedHeader,
          format,
        },
        currentKey,
        rawSecret
      );

      setEncryptedOutput(jwe);

      if (typeof jwe === 'string') {
        setDecryptInput(jwe);
        const parts = jwe.split('.');
        if (parts.length === 5) {
          setJweParts(parts);
        }
        performDecrypt(jwe);
      } else {
        const jsonStr = JSON.stringify(jwe, null, 2);
        setDecryptInput(jsonStr);
        performDecrypt(jsonStr);
      }
    } catch (err: any) {
      setEncryptError(err.message || 'Encryption failed');
    }
  };

  const performDecrypt = async (inputStr: string) => {
    if (!inputStr.trim()) {
      setDecryptedText('');
      setDecryptedHeader(null);
      setDecryptError('');
      return;
    }

    try {
      setDecryptError('');
      let jweInput: any = inputStr.trim();

      // Check if general JSON format
      if (inputStr.trim().startsWith('{')) {
        try {
          jweInput = JSON.parse(inputStr);
        } catch {}
      }

      const result = await decryptJwe(jweInput, currentKey, rawSecret);
      setDecryptedText(result.plaintext);
      setDecryptedHeader(result.protectedHeader);
    } catch (err: any) {
      setDecryptedText('');
      setDecryptedHeader(null);
      setDecryptError(err.message || 'Decryption failed (Invalid key, corrupted auth tag, or altered ciphertext)');
    }
  };

  const handlePartChange = (partIndex: number, newValue: string) => {
    const newParts = [...jweParts];
    newParts[partIndex] = newValue.trim();
    setJweParts(newParts);

    const reassembledToken = newParts.join('.');
    setDecryptInput(reassembledToken);
    performDecrypt(reassembledToken);
  };

  const handleOpenSandbox = () => {
    let parsedHeader = {};
    if (customHeaderJson.trim()) {
      try {
        parsedHeader = JSON.parse(customHeaderJson);
      } catch {}
    }

    const code = generateJweCodeSnippet(
      {
        plaintext,
        alg,
        enc,
        header: parsedHeader,
        format,
      },
      currentKey,
      rawSecret
    );
    onOpenInSandbox(code);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Key Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JWE JSON Web Encryption</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Encrypt payloads for privacy & decrypt with private keys</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSandbox}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Terminal className="w-3.5 h-3.5" />
            Open in Sandbox
          </button>

          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none focus:border-violet-500"
          >
            <option value="">Custom Raw Secret / Key</option>
            {keys.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.alg}) {k.use === 'enc' ? '[ENC]' : ''}
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

      {/* Grid: Encryptor & Decryptor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: JWE Encryptor (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              1. Encrypt Payload
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Key Management (alg)</label>
              <select
                value={alg}
                onChange={(e) => setAlg(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <optgroup label="RSA Keys (RS256/RSA-OAEP)" disabled={!noKeySelected && !isRsaKey}>
                  <option value="RSA-OAEP-256">RSA-OAEP-256</option>
                  <option value="RSA-OAEP">RSA-OAEP (SHA-1)</option>
                </optgroup>
                <optgroup label="Elliptic Curve (EC P-256/384/521)" disabled={!noKeySelected && !isEcKey}>
                  <option value="ECDH-ES">ECDH-ES</option>
                </optgroup>
                <optgroup label="Symmetric / Secret Keys (oct)" disabled={!noKeySelected && !isSymmetricKey}>
                  <option value="dir">dir (Direct Shared Key)</option>
                  <option value="A128KW">A128KW</option>
                  <option value="A256KW">A256KW</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Content Enc (enc)</label>
              <select
                value={enc}
                onChange={(e) => setEnc(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="A256GCM">A256GCM</option>
                <option value="A128GCM">A128GCM</option>
                <option value="A128CBC-HS256">A128CBC-HS256</option>
                <option value="A256CBC-HS512">A256CBC-HS512</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500"
              >
                <option value="compact">Compact Serialization</option>
                <option value="json">General JSON Serialization</option>
              </select>
            </div>
          </div>

          {currentKey && (
            <p className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-950/40 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
              Compatible JWE algorithms are enabled based on your selected{' '}
              <span className="text-violet-600 dark:text-violet-400 font-semibold">{currentKey.name}</span>.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-pink-600 dark:text-pink-400 mb-1">Custom Protected Header (JSON)</label>
            <textarea
              rows={3}
              value={customHeaderJson}
              onChange={(e) => setCustomHeaderJson(e.target.value)}
              placeholder={`{\n  "cty": "json",\n  "kid": "key-id"\n}`}
              className="w-full p-2.5 text-xs font-mono rounded-xl bg-pink-50/50 dark:bg-zinc-950 border border-pink-200 dark:border-pink-900/40 text-pink-900 dark:text-pink-200 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Plaintext / Payload</label>
            <textarea
              rows={5}
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Enter plaintext message or JSON object"
              className="w-full p-3 text-xs font-mono rounded-xl bg-emerald-50/50 dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {encryptError && (
            <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              {encryptError}
            </div>
          )}

          <button
            onClick={handleEncrypt}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950/40"
          >
            Encrypt JWE Token
          </button>
        </div>

        {/* Right Column: JWE Decryptor & Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Unlock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              2. Decrypt & Inspect JWE
            </h3>
          </div>

          {typeof encryptedOutput === 'string' && encryptedOutput && (
            <ColorCodedToken
              token={encryptedOutput}
              type="JWE"
              hoveredPart={hoveredPart}
              onHoverPart={setHoveredPart}
            />
          )}

          {/* JWE Decoded Protected Header Inspection Panel */}
          {decryptedHeader && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                hoveredPart === 0
                  ? 'bg-pink-100/80 dark:bg-pink-950/50 border-pink-500 scale-[1.01]'
                  : 'bg-pink-50/40 dark:bg-zinc-950 border-pink-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400">JWE Protected Header</span>
                <span className="text-[10px] text-zinc-500 font-mono">Algorithm ({decryptedHeader.alg}) & Content Enc ({decryptedHeader.enc})</span>
              </div>
              <pre className="text-xs font-mono text-pink-800 dark:text-pink-200 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(decryptedHeader, null, 2)}
              </pre>
            </div>
          )}

          {/* Interactive 5-Part Segment Editor & Tamper Tool */}
          {jweParts.some((p) => p.length > 0) && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Edit / Tamper Compact JWE Segments:
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">5 Base64URL Parts</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {['Protected Header (0)', 'Encrypted Key (1)', 'Initialization Vector (2)', 'Ciphertext (3)', 'Auth Tag (4)'].map((label, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <label className={`block text-[11px] font-semibold ${
                      idx === 0 ? 'text-pink-600 dark:text-pink-400' : idx === 1 ? 'text-emerald-600 dark:text-emerald-400' : idx === 2 ? 'text-amber-600 dark:text-amber-400' : idx === 3 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      Part {idx}: {label}
                    </label>
                    <input
                      type="text"
                      value={jweParts[idx] || ''}
                      onChange={(e) => handlePartChange(idx, e.target.value)}
                      placeholder={`Part ${idx} base64url string`}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-violet-500 break-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Encrypted JWE Input</label>
            <textarea
              rows={3}
              value={decryptInput}
              onChange={(e) => {
                setDecryptInput(e.target.value);
                performDecrypt(e.target.value);
              }}
              placeholder="Paste Compact JWE string (5 parts) or JSON object"
              className="w-full p-3 text-xs font-mono rounded-xl bg-purple-50/50 dark:bg-zinc-950 border border-purple-200 dark:border-purple-900/40 text-purple-900 dark:text-purple-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {decryptError && (
            <div className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{decryptError}</span>
            </div>
          )}

          {decryptedText && (
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Successfully Decrypted Plaintext:</span>
              </div>
              <pre className="p-3 bg-white dark:bg-zinc-950 rounded-lg font-mono text-xs text-purple-900 dark:text-purple-200 overflow-x-auto whitespace-pre-wrap border border-purple-200 dark:border-purple-900/40">
                {decryptedText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
