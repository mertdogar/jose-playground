import React from 'react';
import { Key, Shield, Terminal, BookOpen, Sun, Moon, Sparkles } from 'lucide-react';
import type { StoredKey } from '../../lib/keys/keyStore';

interface NavbarProps {
  activeTab: 'jwt' | 'jwe' | 'jws' | 'jwk' | 'decoder' | 'sandbox';
  setActiveTab: (tab: 'jwt' | 'jwe' | 'jws' | 'jwk' | 'decoder' | 'sandbox') => void;
  keys: StoredKey[];
  onOpenKeyManager: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  keys,
  onOpenKeyManager,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                JOSE <span className="text-violet-600 dark:text-violet-400 font-sans font-normal">Playground</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                v6.2.4
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Interactive WebCrypto JWT • JWE • JWS • JWK Workbench
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors">
          <button
            onClick={() => setActiveTab('decoder')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'decoder'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Decoder</span>
          </button>

          <button
            onClick={() => setActiveTab('jwt')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'jwt'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            JWT
          </button>

          <button
            onClick={() => setActiveTab('jwe')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'jwe'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            JWE
          </button>

          <button
            onClick={() => setActiveTab('jws')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'jws'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            JWS
          </button>

          <button
            onClick={() => setActiveTab('jwk')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'jwk'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            JWK / JWKS
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox</span>
          </button>
        </nav>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={onOpenKeyManager}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <Key className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">Key Manager</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
              {keys.length}
            </span>
          </button>

          <a
            href="https://github.com/panva/jose"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors"
            title="jose npm package documentation"
          >
            <BookOpen className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
