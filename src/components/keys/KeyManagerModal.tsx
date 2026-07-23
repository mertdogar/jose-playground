import React, { useState } from 'react';
import { X, Key, Plus, Trash2, Download, Copy, Check, ShieldCheck, Cpu, Code2 } from 'lucide-react';
import type { StoredKey } from '../../lib/keys/keyStore';
import { generateNewKey, saveStoredKeys } from '../../lib/keys/keyStore';
import * as jose from 'jose';

interface KeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: StoredKey[];
  onKeysChange: (updatedKeys: StoredKey[]) => void;
  onSelectKey?: (key: StoredKey) => void;
}

export const KeyManagerModal: React.FC<KeyManagerModalProps> = ({
  isOpen,
  onClose,
  keys,
  onKeysChange,
  onSelectKey,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'import'>('list');
  
  // Generate Form state
  const [keyName, setKeyName] = useState('');
  const [alg, setAlg] = useState('ES256');
  const [use, setUse] = useState<'sig' | 'enc'>('sig');
  const [isGenerating, setIsGenerating] = useState(false);

  // Import Form state
  const [importName, setImportName] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Key details modal view
  const [selectedKeyForDetails, setSelectedKeyForDetails] = useState<StoredKey | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const name = keyName.trim() || `${alg} Key (${new Date().toLocaleTimeString()})`;
      const newKey = await generateNewKey(name, alg, use);
      const updated = [newKey, ...keys];
      onKeysChange(updated);
      saveStoredKeys(updated);
      setKeyName('');
      setActiveTab('list');
    } catch (err: any) {
      alert('Error generating key: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    try {
      const raw = importText.trim();
      if (!raw) throw new Error('Please enter a JWK JSON or PEM string');

      let jwkPrivate: jose.JWK | undefined;
      let jwkPublic: jose.JWK | undefined;
      let pemPrivate: string | undefined;
      let pemPublic: string | undefined;
      let secretText: string | undefined;
      let keyType: 'symmetric' | 'asymmetric' = 'asymmetric';
      let detectedAlg = 'HS256';

      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed.kty === 'oct') {
          keyType = 'symmetric';
          jwkPrivate = parsed;
          detectedAlg = parsed.alg || 'HS256';
        } else {
          keyType = 'asymmetric';
          if (parsed.d) {
            jwkPrivate = parsed;
          } else {
            jwkPublic = parsed;
          }
          detectedAlg = parsed.alg || (parsed.kty === 'RSA' ? 'RS256' : parsed.kty === 'EC' ? 'ES256' : 'EdDSA');
        }
      } else if (raw.includes('PRIVATE KEY')) {
        keyType = 'asymmetric';
        pemPrivate = raw;
        detectedAlg = 'RS256';
      } else if (raw.includes('PUBLIC KEY')) {
        keyType = 'asymmetric';
        pemPublic = raw;
        detectedAlg = 'RS256';
      } else {
        keyType = 'symmetric';
        secretText = raw;
        detectedAlg = 'HS256';
      }

      const name = importName.trim() || `Imported ${keyType} Key`;
      const newKey: StoredKey = {
        id: 'imported-' + Math.random().toString(36).substring(2, 9),
        name,
        alg: detectedAlg,
        type: keyType,
        use: 'sig',
        jwkPrivate,
        jwkPublic,
        pemPrivate,
        pemPublic,
        secretText,
        createdAt: Date.now(),
      };

      const updated = [newKey, ...keys];
      onKeysChange(updated);
      saveStoredKeys(updated);
      setImportName('');
      setImportText('');
      setActiveTab('list');
    } catch (err: any) {
      setImportError(err.message || 'Failed to import key');
    }
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Are you sure you want to delete this key?')) {
      const updated = keys.filter((k) => k.id !== id);
      onKeysChange(updated);
      saveStoredKeys(updated);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Global Key Manager</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage, generate, and import keys for JWT, JWE, JWS & JWK tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'list'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-zinc-200/50 dark:bg-zinc-800/50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Stored Keys ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'generate'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-zinc-200/50 dark:bg-zinc-800/50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Generate Key
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-zinc-200/50 dark:bg-zinc-800/50'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Import JWK / PEM / Secret
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'list' && (
            <div className="space-y-3">
              {keys.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  No stored keys yet. Click "Generate Key" to create your first Web Crypto key.
                </div>
              ) : (
                keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-200">{k.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/50">
                          {k.alg}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-zinc-800 text-zinc-300">
                          {k.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        ID: {k.id} • Created: {new Date(k.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedKeyForDetails(k)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5 text-violet-400" />
                        Inspect Details
                      </button>

                      {onSelectKey && (
                        <button
                          onClick={() => {
                            onSelectKey(k);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer shadow-md"
                        >
                          Use Key
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <form onSubmit={handleGenerate} className="space-y-4 max-w-lg mx-auto py-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Key Friendly Name</label>
                <input
                  type="text"
                  placeholder="e.g. My RS256 Production Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Algorithm (alg)</label>
                  <select
                    value={alg}
                    onChange={(e) => setAlg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                  >
                    <optgroup label="Asymmetric Signing (JWS / JWT)">
                      <option value="ES256">ES256 (EC P-256)</option>
                      <option value="ES384">ES384 (EC P-384)</option>
                      <option value="ES512">ES512 (EC P-521)</option>
                      <option value="RS256">RS256 (RSA 2048-bit)</option>
                      <option value="RS384">RS384 (RSA 3072-bit)</option>
                      <option value="RS512">RS512 (RSA 4096-bit)</option>
                      <option value="PS256">PS256 (RSA-PSS 2048-bit)</option>
                      <option value="EdDSA">EdDSA (Ed25519 Curve)</option>
                    </optgroup>
                    <optgroup label="Symmetric Signing & Encryption">
                      <option value="HS256">HS256 (HMAC-SHA256)</option>
                      <option value="HS384">HS384 (HMAC-SHA384)</option>
                      <option value="HS512">HS512 (HMAC-SHA512)</option>
                      <option value="A128GCM">A128GCM (AES-128 GCM)</option>
                      <option value="A256GCM">A256GCM (AES-256 GCM)</option>
                      <option value="A128KW">A128KW (AES-128 Key Wrap)</option>
                    </optgroup>
                    <optgroup label="Asymmetric Encryption (JWE)">
                      <option value="RSA-OAEP-256">RSA-OAEP-256</option>
                      <option value="RSA-OAEP">RSA-OAEP (SHA-1)</option>
                      <option value="ECDH-ES">ECDH-ES</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Key Usage (use)</label>
                  <select
                    value={use}
                    onChange={(e) => setUse(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="sig">Signature (sig)</option>
                    <option value="enc">Encryption (enc)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Cpu className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isGenerating ? 'Generating WebCrypto Keypair...' : 'Generate Keypair'}
              </button>
            </form>
          )}

          {activeTab === 'import' && (
            <form onSubmit={handleImport} className="space-y-4 max-w-lg mx-auto py-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g. Imported Customer Public Key"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">JWK JSON / PEM / Secret String</label>
                <textarea
                  rows={6}
                  placeholder={`Paste JWK JSON:\n{\n  "kty": "RSA",\n  "n": "...",\n  "e": "AQAB"\n}\n\nOR PEM:\n-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              {importError && (
                <div className="p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-xl">
                  {importError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import Key
              </button>
            </form>
          )}

          {/* Key Details View Modal */}
          {selectedKeyForDetails && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-base font-semibold text-zinc-100">{selectedKeyForDetails.name}</h3>
                  <button
                    onClick={() => setSelectedKeyForDetails(null)}
                    className="p-1 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs max-h-[60vh] overflow-y-auto pr-1">
                  {selectedKeyForDetails.secretText && (
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Secret String</span>
                        <button
                          onClick={() => copyToClipboard(selectedKeyForDetails.secretText!, 'secret')}
                          className="text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {copiedField === 'secret' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 bg-zinc-950 rounded-xl text-zinc-200 border border-zinc-800 whitespace-pre-wrap">
                        {selectedKeyForDetails.secretText}
                      </pre>
                    </div>
                  )}

                  {selectedKeyForDetails.jwkPublic && (
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Public JWK</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(selectedKeyForDetails.jwkPublic, null, 2), 'jwkPublic')}
                          className="text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {copiedField === 'jwkPublic' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 bg-zinc-950 rounded-xl text-zinc-200 border border-zinc-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedKeyForDetails.jwkPublic, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedKeyForDetails.jwkPrivate && (
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Private JWK</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(selectedKeyForDetails.jwkPrivate, null, 2), 'jwkPrivate')}
                          className="text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {copiedField === 'jwkPrivate' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 bg-zinc-950 rounded-xl text-zinc-200 border border-zinc-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedKeyForDetails.jwkPrivate, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedKeyForDetails.pemPublic && (
                    <div>
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>Public SPKI PEM</span>
                        <button
                          onClick={() => copyToClipboard(selectedKeyForDetails.pemPublic!, 'pemPublic')}
                          className="text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {copiedField === 'pemPublic' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 bg-zinc-950 rounded-xl text-zinc-200 border border-zinc-800 whitespace-pre-wrap">
                        {selectedKeyForDetails.pemPublic}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
