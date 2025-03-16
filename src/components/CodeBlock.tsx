import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Button } from './ui/Button';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Choose theme based on system/app color scheme
  const isDarkMode = document.documentElement.classList.contains('dark');
  const theme = isDarkMode ? themes.vsDark : themes.vsLight;

  return (
    <div className="relative group rounded-md overflow-hidden my-5 border shadow-sm">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-7 w-7 p-0 rounded-md bg-card/80 backdrop-blur-sm hover:bg-card/95 shadow-sm"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      
      <div className="text-xs font-mono px-3 py-1.5 bg-card/90 text-muted-foreground border-b border-border/50 flex items-center">
        <span className="flex-1 text-xs font-semibold">{language.toUpperCase()}</span>
        {copied && (
          <span className="text-xs text-green-500 mr-8 transition-opacity animate-fade-in">
            Copied!
          </span>
        )}
      </div>
      
      <Highlight
        theme={theme}
        code={code.trim()}
        language={language}
      >
        {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${hlClassName} overflow-x-auto p-4 text-sm leading-relaxed`} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })} className="table-row">
                <span className="table-cell text-right pr-4 select-none opacity-50 text-xs w-10">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}; 