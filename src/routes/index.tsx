import { createFileRoute } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { JwtWorkbench } from '../components/jwt/JwtWorkbench';
import { JweWorkbench } from '../components/jwe/JweWorkbench';
import { JwsWorkbench } from '../components/jws/JwsWorkbench';
import { JwkWorkbench } from '../components/jwk/JwkWorkbench';
import { CodeSandbox } from '../components/code/CodeSandbox';
import { KeyManagerModal } from '../components/keys/KeyManagerModal';
import type { StoredKey } from '../lib/keys/keyStore';
import { loadStoredKeys, createDefaultKeys, saveStoredKeys } from '../lib/keys/keyStore';
import { Key, Shield, Sparkles, Code2, BookOpen } from 'lucide-react';

export const Route = createFileRoute('/')({ component: JosePlaygroundApp });

function JosePlaygroundApp() {
  const [activeTab, setActiveTab] = useState<'jwt' | 'jwe' | 'jws' | 'jwk' | 'sandbox'>('jwt');
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    async function initKeys() {
      let loaded = loadStoredKeys();
      if (loaded.length === 0) {
        loaded = await createDefaultKeys();
        saveStoredKeys(loaded);
      }
      setKeys(loaded);
    }
    initKeys();

    // Theme initialization
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = storedTheme === 'light' ? 'light' : 'dark';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleOpenInSandbox = (code: string) => {
    setSandboxCode(code);
    setActiveTab('sandbox');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200 transition-colors">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        keys={keys}
        onOpenKeyManager={() => setIsKeyManagerOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'jwt' && (
          <JwtWorkbench
            keys={keys}
            onOpenKeyManager={() => setIsKeyManagerOpen(true)}
            onOpenInSandbox={handleOpenInSandbox}
          />
        )}

        {activeTab === 'jwe' && (
          <JweWorkbench
            keys={keys}
            onOpenKeyManager={() => setIsKeyManagerOpen(true)}
            onOpenInSandbox={handleOpenInSandbox}
          />
        )}

        {activeTab === 'jws' && (
          <JwsWorkbench
            keys={keys}
            onOpenKeyManager={() => setIsKeyManagerOpen(true)}
            onOpenInSandbox={handleOpenInSandbox}
          />
        )}

        {activeTab === 'jwk' && (
          <JwkWorkbench
            keys={keys}
            onOpenKeyManager={() => setIsKeyManagerOpen(true)}
            onOpenInSandbox={handleOpenInSandbox}
          />
        )}

        {activeTab === 'sandbox' && <CodeSandbox key={sandboxCode} initialCode={sandboxCode} />}
      </main>

      {/* Footer */}
      <Footer activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Global Key Manager Modal */}
      <KeyManagerModal
        isOpen={isKeyManagerOpen}
        onClose={() => setIsKeyManagerOpen(false)}
        keys={keys}
        onKeysChange={setKeys}
      />
    </div>
  );
}
