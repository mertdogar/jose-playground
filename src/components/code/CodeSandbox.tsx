import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, Terminal, RefreshCw, Wand2 } from 'lucide-react';
import * as jose from 'jose';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

import * as prettier from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as parserEstree from 'prettier/plugins/estree';

interface CodeSandboxProps {
  initialCode?: string;
  theme?: 'dark' | 'light';
}

const DEFAULT_CODE = `import * as jose from 'jose';

// 1. Generate an ES256 keypair
const { publicKey, privateKey } = await jose.generateKeyPair('ES256');

// 2. Sign a JWT
const jwt = await new jose.SignJWT({ sub: 'user_123', role: 'admin' })
  .setProtectedHeader({ alg: 'ES256' })
  .setIssuedAt()
  .setExpirationTime('2h')
  .sign(privateKey);

console.log('Signed JWT:', jwt);

// 3. Verify the JWT
const { payload, protectedHeader } = await jose.jwtVerify(jwt, publicKey);

console.log('Verified Header:', protectedHeader);
console.log('Verified Payload:', payload);
`;

export const CodeSandbox: React.FC<CodeSandboxProps> = ({ initialCode, theme }) => {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleLogs([]);
    const logs: string[] = [];

    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
    };

    try {
      const runnableBody = code.replace(/import\s+\*\s+as\s+jose\s+from\s+['"]jose['"];?/g, '');
      const asyncFn = new Function('jose', 'console', `return (async () => { ${runnableBody} })();`);
      await asyncFn(jose, customConsole);

      if (logs.length === 0) {
        logs.push('Code executed cleanly with no console output.');
      }
    } catch (err: any) {
      logs.push(`[RUNTIME EXCEPTION] ${err.message || String(err)}`);
    } finally {
      setConsoleLogs(logs);
      setIsRunning(false);
    }
  };

  const handleFormatCode = async () => {
    setIsFormatting(true);
    try {
      const formatted = await prettier.format(code, {
        parser: 'babel-ts',
        plugins: [parserBabel.default || parserBabel, parserEstree.default || parserEstree],
        semi: true,
        singleQuote: true,
        printWidth: 80,
      });
      setCode(formatted);
    } catch (err: any) {
      console.error('Format error:', err);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Interactive Jose Code Sandbox</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Write custom `jose` TypeScript/JavaScript code with CodeMirror & Prettier</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFormatCode}
            disabled={isFormatting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Format Code with Prettier"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {isFormatting ? 'Formatting...' : 'Format Code'}
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950/40 disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isRunning ? 'Executing...' : 'Run Sandbox Code'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Code Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <span>TypeScript Editor (CodeMirror)</span>
            </span>
            <span className="text-[10px] text-zinc-500">jose v6.2.4 loaded</span>
          </div>

          <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 shadow-inner bg-zinc-900 dark:bg-zinc-950">
            <CodeMirror
              value={code}
              height="580px"
              theme={isDarkMode ? oneDark : undefined}
              extensions={[javascript({ typescript: true, jsx: true })]}
              onChange={(val) => setCode(val)}
              className="text-xs font-mono"
            />
          </div>
        </div>

        {/* Console Log Output (5 cols) */}
        <div className="lg:col-span-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 font-mono">
            <span>Execution Console Output</span>
            <button
              onClick={() => setConsoleLogs([])}
              className="text-[10px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div className="h-[580px] p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs overflow-y-auto space-y-2 text-zinc-800 dark:text-zinc-300">
            {consoleLogs.length === 0 ? (
              <span className="text-zinc-400 dark:text-zinc-600 italic">Click "Run Sandbox Code" to execute script and see outputs...</span>
            ) : (
              consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg break-all whitespace-pre-wrap ${
                    log.startsWith('[ERROR]')
                      ? 'bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                      : log.startsWith('[RUNTIME EXCEPTION]')
                      ? 'bg-rose-100 dark:bg-rose-950/60 border border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                      : 'bg-emerald-50 dark:bg-zinc-900/60 border border-emerald-200 dark:border-zinc-800/60 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
