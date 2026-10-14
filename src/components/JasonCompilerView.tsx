import React, { useState } from 'react';
import { JASONScanner } from '../compiler/jasonScanner';
import { JASONParser } from '../compiler/jasonParser';
import { Token, CompilerError, ASTNode, SymbolEntry } from '../compiler/jasonTypes';
import { Play, RotateCcw, Copy, Check, Table, AlertTriangle, Layers, BookOpen } from 'lucide-react';

const JASON_SAMPLE = `PROGRAM Calculator;
DECLARE
    INTEGER x, y, sum, diff;
    REAL avg;
BEGIN
    SET x = 15;
    SET y = 5;
    
    SET sum = x + y;
    SET diff = x - y;
    
    WRITE "Sum is:";
    WRITE sum;
    WRITE "Difference is:";
    WRITE diff;
    
    IF sum > 10 THEN
        WRITE "Sum exceeds ten";
    ELSE
        WRITE "Sum is small";
    ENDIF;
END.
`;

export const JasonCompilerView: React.FC = () => {
  const [code, setCode] = useState<string>(JASON_SAMPLE);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [errors, setErrors] = useState<CompilerError[]>([]);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [symbols, setSymbols] = useState<SymbolEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tokens' | 'symbols' | 'tree' | 'errors'>('tokens');
  const [copied, setCopied] = useState(false);

  const handleCompile = () => {
    const scanner = new JASONScanner();
    const scanResult = scanner.startScanning(code);
    setTokens(scanResult.tokens);

    const parser = new JASONParser();
    const parseResult = parser.parse(scanResult.tokens);
    setAst(parseResult.ast);
    setSymbols(parseResult.symbolTable);

    setErrors([...scanResult.errors, ...parseResult.errors]);
  };

  const handleClear = () => {
    setCode('');
    setTokens([]);
    setErrors([]);
    setAst(null);
    setSymbols([]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>JASON Compiler Template IDE</span>
            <span className="text-xs font-normal text-slate-400">(Form1 & Form2 Windows Forms Architecture)</span>
          </h2>
          <p className="text-xs text-slate-400">Lexical Scanner • Recursive Descent Parser • Symbol Table • Parse Tree</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Compile !</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left: JASON Source Code */}
        <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>JASON Code (textBox1)</span>
            <span className="text-slate-500 font-mono text-[11px]">{code.split('\n').length} lines</span>
          </div>
          <div className="flex-1 p-3 min-h-0">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Type JASON program code here..."
              spellCheck={false}
              className="w-full h-full p-2 font-mono text-xs leading-5 text-slate-200 bg-transparent resize-none focus:outline-none selection:bg-blue-600/40"
            />
          </div>
        </div>

        {/* Right: Output Tabs (Tokens, Symbol Table, Parse Tree, Errors) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-950">
          {/* Tabs bar */}
          <div className="flex items-center justify-between px-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'tokens'
                    ? 'border-blue-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tokens Table ({tokens.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('symbols')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'symbols'
                    ? 'border-blue-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Symbol Table ({symbols.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'tree'
                    ? 'border-blue-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Parse Tree</span>
              </button>

              <button
                onClick={() => setActiveTab('errors')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition cursor-pointer ${
                  activeTab === 'errors'
                    ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Error List ({errors.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto min-h-0 p-3">
            {activeTab === 'tokens' && (
              <div className="overflow-x-auto">
                {tokens.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Click <strong>Compile !</strong> to scan and produce tokens.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">#</th>
                        <th className="py-2 px-3">Lexeme</th>
                        <th className="py-2 px-3">Token Class</th>
                        <th className="py-2 px-2 text-center">Line</th>
                        <th className="py-2 px-2 text-center">Col</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {tokens.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900/60">
                          <td className="py-1.5 px-3 text-center text-slate-600">{t.id}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-100">{t.lex}</td>
                          <td className="py-1.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                              {t.token_type}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{t.line}</td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{t.col}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'symbols' && (
              <div className="overflow-x-auto">
                {symbols.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No symbols yet. Click <strong>Compile !</strong> to parse identifiers and variables.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <tr>
                        <th className="py-2 px-3">Identifier</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Data Type</th>
                        <th className="py-2 px-3">Scope</th>
                        <th className="py-2 px-2 text-center">Line</th>
                        <th className="py-2 px-3">Init Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {symbols.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="py-1.5 px-3 font-semibold text-sky-300">{s.name}</td>
                          <td className="py-1.5 px-3 text-slate-300">{s.tokenClass}</td>
                          <td className="py-1.5 px-3 text-amber-300">{s.dataType}</td>
                          <td className="py-1.5 px-3 text-slate-400">{s.scope}</td>
                          <td className="py-1.5 px-2 text-center text-slate-400">{s.line}</td>
                          <td className="py-1.5 px-3 text-slate-400">{s.value || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'tree' && (
              <div className="p-3">
                {ast ? (
                  <div className="font-mono text-xs bg-slate-900/70 p-4 rounded-lg border border-slate-800 overflow-auto">
                    <ASTViewer node={ast} />
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Click <strong>Compile !</strong> to generate the syntax parse tree.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="space-y-2">
                {errors.length === 0 ? (
                  <div className="p-8 text-center text-emerald-400 text-xs">
                    No compilation errors found! Code compiled successfully.
                  </div>
                ) : (
                  errors.map((err) => (
                    <div key={err.id} className="p-2.5 rounded bg-rose-950/40 border border-rose-900/60 text-xs font-mono">
                      <div className="flex items-center justify-between text-rose-300 font-semibold mb-1">
                        <span>[{err.phase}] Line {err.line}, Col {err.col}</span>
                        <span className="text-[10px] uppercase bg-rose-900/50 px-1.5 py-0.5 rounded">{err.severity}</span>
                      </div>
                      <p className="text-slate-200">{err.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple recursive AST tree node visualizer
const ASTViewer: React.FC<{ node: ASTNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 3);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-3 my-0.5">
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition cursor-pointer select-none ${
          node.type === 'rule'
            ? 'bg-blue-950 text-blue-200 border border-blue-800/80 font-semibold'
            : 'bg-slate-800 text-amber-200 border border-slate-700'
        }`}
      >
        {hasChildren && <span className="text-[10px] text-blue-400">{expanded ? '▼' : '►'}</span>}
        <span>{node.name}</span>
        {node.value && <span className="text-slate-400 italic">({node.value})</span>}
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-slate-700/80 ml-2 pl-2">
          {node.children!.map((child) => (
            <ASTViewer key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
