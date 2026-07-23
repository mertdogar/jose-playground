import React from 'react';
import {
  ShieldCheck,
  Github,
  User,
  FolderGit2,
  ExternalLink,
  Code2,
  BookOpen,
  ArrowUp,
  Terminal,
  Cpu,
  Lock,
} from 'lucide-react';

interface FooterProps {
  activeTab?: 'jwt' | 'jwe' | 'jws' | 'jwk' | 'decoder' | 'sandbox';
  onSelectTab: (tab: 'jwt' | 'jwe' | 'jws' | 'jwk' | 'decoder' | 'sandbox') => void;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, onSelectTab }) => {
  const handleTabClick = (tab: 'jwt' | 'jwe' | 'jws' | 'jwk' | 'decoder' | 'sandbox') => {
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/90 dark:bg-zinc-950/90 text-zinc-600 dark:text-zinc-400 text-xs transition-colors mt-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-zinc-200/80 dark:border-zinc-900/80">
          {/* Column 1: Author & Project Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-sm">
                <Lock className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-zinc-900 dark:text-white font-mono tracking-tight">
                JOSE <span className="text-violet-600 dark:text-violet-400 font-sans font-normal">Playground</span>
              </span>
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
              Interactive WebCrypto workbench for encoding, decoding, signing, and encrypting JWT, JWE, JWS, and JWK data structures.
            </p>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side WebCrypto Safety</span>
            </div>

            <div className="pt-2 space-y-1.5">
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Created by Mert Dogar
              </div>
              <div className="flex flex-col gap-1.5">
                <a
                  href="https://github.com/mertdogar"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors w-fit group"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500" />
                  <span>GitHub Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a
                  href="https://github.com/mertdogar/jose-playground"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors w-fit group"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500" />
                  <span>Project Repository</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Workbench Tools */}
          <div className="space-y-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs tracking-wider uppercase font-mono">
              Workbench Tools
            </h3>
            <ul className="space-y-2 text-[12px]">
              <li>
                <button
                  onClick={() => handleTabClick('decoder')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'decoder'
                      ? 'text-violet-600 dark:text-violet-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span>Universal JOSE Decoder</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('jwt')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'jwt'
                      ? 'text-violet-600 dark:text-violet-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span>JWT Debugger & Workbench</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('jwe')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'jwe'
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>JWE Encrypt & Decrypt</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('jws')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'jws'
                      ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>JWS Sign & Verify</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('jwk')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'jwk'
                      ? 'text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>JWK & JWKS Key Generator</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabClick('sandbox')}
                  className={`inline-flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeTab === 'sandbox'
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Interactive Code Sandbox</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: JOSE RFC Standards */}
          <div className="space-y-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs tracking-wider uppercase font-mono">
              JOSE Specifications
            </h3>
            <ul className="space-y-2 text-[12px]">
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc7519"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-500" />
                  <span>RFC 7519: JWT Spec</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc7516"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500" />
                  <span>RFC 7516: JWE Spec</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc7515"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-500" />
                  <span>RFC 7515: JWS Spec</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://datatracker.ietf.org/doc/html/rfc7517"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500" />
                  <span>RFC 7517: JWK Spec</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/panva/jose"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <Github className="w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-500" />
                  <span>panva/jose Core Library</span>
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Tech Stack & Credits */}
          <div className="space-y-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs tracking-wider uppercase font-mono">
              Tech Stack & License
            </h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-violet-500" />
                <span>TanStack Start & React 19</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>CodeMirror 6 Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-mono text-[9px] font-bold">
                  #
                </span>
                <span>Tailwind CSS v4</span>
              </div>
              <div className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
                Released under the <span className="font-semibold text-zinc-700 dark:text-zinc-300">MIT License</span>. Free and open source for developer use.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} <strong className="text-zinc-700 dark:text-zinc-300 font-medium">Mert Dogar</strong>. All rights reserved.</span>
          </div>

          <button
            onClick={handleScrollTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 hover:bg-zinc-300/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer border border-zinc-300/60 dark:border-zinc-800"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
