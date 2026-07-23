import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

interface ColorCodedTokenProps {
  token: string;
  type?: 'JWT' | 'JWE' | 'JWS';
  onHoverPart?: (partIndex: number | null) => void;
  hoveredPart?: number | null;
}

export const ColorCodedToken: React.FC<ColorCodedTokenProps> = ({
  token,
  type = 'JWT',
  onHoverPart,
  hoveredPart,
}) => {
  const [copied, setCopied] = useState(false);

  if (!token) {
    return (
      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-mono text-center">
        No token generated yet. Click "Sign" or "Encrypt" to produce a token.
      </div>
    );
  }

  const parts = token.split('.');

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPartClass = (index: number) => {
    const isHovered = hoveredPart === index;

    if (type === 'JWT' || type === 'JWS') {
      // 3 Parts: 0=Header (Pink), 1=Payload (Purple), 2=Signature (Cyan)
      switch (index) {
        case 0:
          return isHovered
            ? 'bg-pink-500/30 text-pink-700 dark:text-pink-200 ring-1 ring-pink-400'
            : 'text-pink-600 dark:text-pink-400 hover:bg-pink-500/20';
        case 1:
          return isHovered
            ? 'bg-purple-500/30 text-purple-700 dark:text-purple-200 ring-1 ring-purple-400'
            : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/20';
        case 2:
          return isHovered
            ? 'bg-cyan-500/30 text-cyan-700 dark:text-cyan-200 ring-1 ring-cyan-400'
            : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20';
        default:
          return 'text-zinc-700 dark:text-zinc-300';
      }
    } else {
      // JWE - 5 Parts: 0=Header (Pink), 1=EncKey (Emerald), 2=IV (Amber), 3=Ciphertext (Purple), 4=Tag (Rose)
      switch (index) {
        case 0:
          return isHovered ? 'bg-pink-500/30 text-pink-700 dark:text-pink-200 ring-1 ring-pink-400' : 'text-pink-600 dark:text-pink-400 hover:bg-pink-500/20';
        case 1:
          return isHovered ? 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-400' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20';
        case 2:
          return isHovered ? 'bg-amber-500/30 text-amber-700 dark:text-amber-200 ring-1 ring-amber-400' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/20';
        case 3:
          return isHovered ? 'bg-purple-500/30 text-purple-700 dark:text-purple-200 ring-1 ring-purple-400' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/20';
        case 4:
          return isHovered ? 'bg-rose-500/30 text-rose-700 dark:text-rose-200 ring-1 ring-rose-400' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/20';
        default:
          return 'text-zinc-700 dark:text-zinc-300';
      }
    }
  };

  const getPartLabel = (index: number) => {
    if (type === 'JWT' || type === 'JWS') {
      return ['Protected Header', 'Payload / Claims', 'Signature'][index] || `Part ${index}`;
    }
    return ['Protected Header', 'Encrypted Key', 'Initialization Vector', 'Ciphertext', 'Authentication Tag'][index] || `Part ${index}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <span>Encoded Compact {type}</span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span className="text-zinc-500 dark:text-zinc-500 font-normal">Hover segments to highlight components</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg border border-zinc-300 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied Token' : 'Copy Token'}
        </button>
      </div>

      <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800/80 font-mono text-xs leading-relaxed break-all shadow-inner">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span
              onMouseEnter={() => onHoverPart && onHoverPart(i)}
              onMouseLeave={() => onHoverPart && onHoverPart(null)}
              className={`px-1 py-0.5 rounded transition-all cursor-pointer font-bold ${getPartClass(i)}`}
              title={getPartLabel(i)}
            >
              {part}
            </span>
            {i < parts.length - 1 && <span className="text-zinc-600 font-bold px-0.5">.</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Legend indicator */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
        {parts.map((_, i) => (
          <div
            key={i}
            onMouseEnter={() => onHoverPart && onHoverPart(i)}
            onMouseLeave={() => onHoverPart && onHoverPart(null)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full cursor-pointer transition-all border ${
              hoveredPart === i ? 'border-zinc-500 bg-zinc-800/80 scale-105' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                i === 0 ? 'bg-pink-400' : i === 1 ? (type === 'JWE' ? 'bg-emerald-400' : 'bg-purple-400') : i === 2 ? (type === 'JWE' ? 'bg-amber-400' : 'bg-cyan-400') : i === 3 ? 'bg-purple-400' : 'bg-rose-400'
              }`}
            />
            <span>{getPartLabel(i)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
