'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-base border border-bd border-b-0 rounded-t-md">
        <span className="text-xs text-tx-muted font-mono uppercase">{language}</span>
        <button
          onClick={copy}
          className="text-tx-muted hover:text-tx-primary transition-fast"
          aria-label="Copier"
        >
          {copied ? <Check size={14} className="text-status-success" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-bg-base border border-bd rounded-b-md overflow-x-auto !mt-0 !rounded-t-none">
        <code className={`language-${language} font-mono text-sm`}>{code}</code>
      </pre>
    </div>
  );
}