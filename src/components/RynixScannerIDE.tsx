import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  FileCode,
  Table as TableIcon,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { RynixScanner } from '../compiler/rynixScanner';
import { RynixToken, RynixScannerError, RynixTokenClass } from '../compiler/rynixTypes';
import { RYNIX_SAMPLES } from '../compiler/rynixSamples';

interface RynixScannerIDEProps {
  onOpenDoc: () => void;
}

export const RynixScannerIDE: React.FC<RynixScannerIDEProps> = ({ onOpenDoc }) => {
  const [code, setCode] = useState<string>(RYNIX_SAMPLES[0].code);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(RYNIX_SAMPLES[0].id);
  const [tokens, setTokens] = useState<RynixToken[]>([]);
  const [errors, setErrors] = useState<RynixScannerError[]>([]);
  const [scanDuration, setScanDuration] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedTokens, setCopiedTokens] = useState<boolean>(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner instance
  const scanner = useMemo(() => new RynixScanner(), []);

  // Run scanner
  const handleScan = () => {
    const res = scanner.scan(code);
    setTokens(res.tokens);
    setErrors(res.errors);
    setScanDuration(res.scanDurationMs);
  };

  // Run scan initially and whenever sample changes
  useEffect(() => {
    handleScan();
  }, [code]);

  // Handle sample selection
  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = RYNIX_SAMPLES.find((s) => s.id === sampleId);
    if (sample) {
      setCode(sample.code);
      setHighlightedLine(null);
    }
  };

  // Synchronize line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(1, code.split('\n').length);
  }, [code]);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      // Category filter
      if (selectedFilter !== 'ALL') {
        if (selectedFilter === 'KEYWORDS' && !isKeyword(t.token_type)) return false;
        if (selectedFilter === 'IDENTIFIERS' && t.token_type !== RynixTokenClass.Identifier) return false;
        if (selectedFilter === 'NUMBERS' && t.token_type !== RynixTokenClass.IntConstant && t.token_type !== RynixTokenClass.FloatConstant) return false;
        if (selectedFilter === 'STRINGS' && t.token_type !== RynixTokenClass.StringLiteral && t.token_type !== RynixTokenClass.CharLiteral) return false;
        if (selectedFilter === 'OPERATORS' && !isOperator(t.token_type)) return false;
        if (selectedFilter === 'DELIMITERS' && !isDelimiter(t.token_type)) return false;
        if (selectedFilter === 'COMMENTS' && t.token_type !== RynixTokenClass.SingleLineComment && t.token_type !== RynixTokenClass.MultiLineComment) return false;
        if (selectedFilter === 'ERRORS' && t.token_type !== RynixTokenClass.Unknown) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          t.lex.toLowerCase().includes(q) ||
          t.token_type.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [tokens, selectedFilter, searchQuery]);

  // Copy code helper
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy tokens table as text / TSV
  const handleCopyTokens = async () => {
    const header = ['#', 'Lexeme', 'Token Class', 'Line', 'Col', 'Description'].join('\t');
    const rows = filteredTokens.map((t) =>
      [t.id, t.lex, t.token_type, t.line, t.col, t.description].join('\t')
    );
    await navigator.clipboard.writeText([header, ...rows].join('\n'));
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  // Export tokens to CSV
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Index,Lexeme,Token_Class,Line,Column,Description']
        .concat(
          tokens.map(
            (t) =>
              `${t.id},"${t.lex.replace(/"/g, '""')}",${t.token_type},${t.line},${t.col},"${t.description.replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'rynix_tokens.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Jump to error line in editor
  const handleJumpToError = (line: number) => {
    setHighlightedLine(line);
    if (textareaRef.current) {
      const lines = code.split('\n');
      let charIndex = 0;
      for (let l = 0; l < line - 1 && l < lines.length; l++) {
        charIndex += lines[l].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charIndex, charIndex + (lines[line - 1]?.length || 0));
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCode(content);
        setSelectedSampleId('custom');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-950 text-slate-100">
      {/* Top Banner / Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Rynix Lexical Scanner
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-800 rounded">
                Milestone 1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              DFA-Driven Tokenizer • Regex Engine • Lexeme Table • Error Diagnostics
            </p>
          </div>
        </div>

        {/* Action Controls & Sample Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sample Picker Dropdown */}
          <div className="relative">
            <select
              value={selectedSampleId}
              onChange={(e) => handleSelectSample(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {RYNIX_SAMPLES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
              {selectedSampleId === 'custom' && (
                <option value="custom" className="bg-slate-900 text-slate-200">
                  ★ Custom Code
                </option>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Scan / Compile Button */}
          <button
            onClick={handleScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Scan Code</span>
          </button>

          {/* Clear Editor */}
          <button
            onClick={() => {
              setCode('');
              setSelectedSampleId('custom');
              setTokens([]);
              setErrors([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 border border-slate-700 rounded-lg transition cursor-pointer"
            title="Clear Editor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 border border-slate-700 rounded-lg transition cursor-pointer"
            title="Copy Code to Clipboard"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Open Documentation / PDF Print View */}
          <button
            onClick={onOpenDoc}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/60 rounded-lg transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 Documentation & DFAs</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Two Columns on Desktop) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Panel: Rynix Source Code Editor (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[340px] lg:min-h-0 bg-slate-950">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>Rynix Source Code Editor</span>
              <span className="text-slate-500 font-normal">({lineCount} lines)</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".ryn,.rx,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                title="Upload Rynix source file"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'main.ryn';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                title="Download source code"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="relative flex-1 flex min-h-0 overflow-hidden font-mono text-xs">
            {/* Line numbers column */}
            <div
              ref={lineNumbersRef}
              className="w-12 py-3 bg-slate-900/40 select-none text-right pr-3 text-slate-600 font-mono text-xs overflow-hidden border-r border-slate-800/80"
            >
              {Array.from({ length: lineCount }).map((_, idx) => {
                const lineNum = idx + 1;
                const isErrLine = errors.some((e) => e.line === lineNum);
                const isHigh = highlightedLine === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`leading-6 transition-colors ${
                      isHigh
                        ? 'text-amber-400 font-bold bg-amber-500/10'
                        : isErrLine
                        ? 'text-rose-400 font-bold bg-rose-500/10'
                        : ''
                    }`}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>

            {/* Code Input Area */}
            <div className="relative flex-1 h-full min-h-0">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setSelectedSampleId('custom');
                }}
                onScroll={handleScroll}
                placeholder="Type or paste Rynix code here..."
                spellCheck={false}
                className="w-full h-full p-3 font-mono text-xs leading-6 text-slate-200 bg-transparent resize-none focus:outline-none focus:ring-0 selection:bg-blue-600/40 selection:text-white"
              />
            </div>
          </div>

          {/* Errors List Panel (Bottom of Left Pane) */}
          <div className="border-t border-slate-800 bg-slate-900/80 flex flex-col max-h-52 min-h-[140px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                {errors.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className={errors.length > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                  The Errors List
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    errors.length > 0
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {errors.length} {errors.length === 1 ? 'error' : 'errors'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Scan time: {scanDuration}ms
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
              {errors.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 py-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-1" />
                    <p className="font-medium text-slate-400">No lexical errors detected!</p>
                    <p className="text-[11px] text-slate-600">All characters conform to Rynix token DFAs</p>
                  </div>
                </div>
              ) : (
                errors.map((err) => (
                  <div
                    key={err.id}
                    onClick={() => handleJumpToError(err.line)}
                    className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 hover:bg-rose-950/50 transition cursor-pointer flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-900/60 text-rose-300 border border-rose-700/50">
                          {err.category}
                        </span>
                        <span className="font-semibold text-rose-200">
                          Line {err.line}, Column {err.col}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        Lexeme: {err.lexeme}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px]">{err.message}</p>
                    {err.suggestion && (
                      <p className="text-slate-400 text-[11px] italic">
                        💡 Suggestion: {err.suggestion}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Lexeme-to-Token Table (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col min-h-[380px] lg:min-h-0 bg-slate-950">
          {/* Table Header & Search/Filter Toolbar */}
          <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Lexeme-to-Token Table
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {filteredTokens.length} of {tokens.length} tokens
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyTokens}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer transition"
                  title="Copy token rows"
                >
                  {copiedTokens ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 cursor-pointer transition"
                  title="Export to CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter lexemes or classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5">
                <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'KEYWORDS', label: 'Keywords' },
                  { id: 'IDENTIFIERS', label: 'Identifiers' },
                  { id: 'NUMBERS', label: 'Numbers' },
                  { id: 'STRINGS', label: 'Strings' },
                  { id: 'OPERATORS', label: 'Operators' },
                  { id: 'DELIMITERS', label: 'Delimiters' },
                  { id: 'ERRORS', label: 'Errors' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilter(cat.id)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer whitespace-nowrap ${
                      selectedFilter === cat.id
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Token Grid / Table */}
          <div className="flex-1 overflow-auto min-h-0">
            {filteredTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center p-4">
                <TableIcon className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-medium text-slate-400">No matching tokens found</p>
                <p className="text-[11px] text-slate-600">Try modifying search or type Rynix code in editor</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Lexeme</th>
                    <th className="py-2.5 px-3">Token Class</th>
                    <th className="py-2.5 px-2 text-center w-14">Line</th>
                    <th className="py-2.5 px-2 text-center w-14">Col</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredTokens.map((t) => {
                    const badgeStyle = getTokenBadgeStyle(t.token_type);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleJumpToError(t.line)}
                        className="hover:bg-slate-900/60 transition cursor-pointer"
                      >
                        <td className="py-2 px-3 text-center text-slate-600 select-none text-[11px]">
                          {t.id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">
                          <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-100">
                            {t.lex}
                          </code>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeStyle}`}
                          >
                            {t.token_type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400 text-[11px]">
                          {t.line}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400 text-[11px]">
                          {t.col}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px] hidden sm:table-cell font-sans">
                          {t.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Statistics Bar */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                Total Tokens: <strong className="text-white">{tokens.length}</strong>
              </span>
              <span>
                Keywords: <strong className="text-emerald-400">{tokens.filter((t) => isKeyword(t.token_type)).length}</strong>
              </span>
              <span>
                Identifiers: <strong className="text-sky-400">{tokens.filter((t) => t.token_type === RynixTokenClass.Identifier).length}</strong>
              </span>
              <span>
                Constants: <strong className="text-amber-400">{tokens.filter((t) => t.token_type === RynixTokenClass.IntConstant || t.token_type === RynixTokenClass.FloatConstant).length}</strong>
              </span>
            </div>

            <div>
              Status: <span className="text-emerald-400 font-semibold">Scanner Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper token classifiers
function isKeyword(type: RynixTokenClass): boolean {
  return [
    RynixTokenClass.Var,
    RynixTokenClass.Fun,
    RynixTokenClass.Class,
    RynixTokenClass.Init,
    RynixTokenClass.New,
    RynixTokenClass.If,
    RynixTokenClass.Else,
    RynixTokenClass.While,
    RynixTokenClass.For,
    RynixTokenClass.In,
    RynixTokenClass.Return,
    RynixTokenClass.Break,
    RynixTokenClass.Continue,
    RynixTokenClass.Print,
    RynixTokenClass.Input,
    RynixTokenClass.TypeInt,
    RynixTokenClass.TypeFloat,
    RynixTokenClass.TypeString,
    RynixTokenClass.TypeChar,
    RynixTokenClass.TypeBool,
    RynixTokenClass.TypeVoid,
    RynixTokenClass.TypeArray,
    RynixTokenClass.BoolLiteral,
    RynixTokenClass.NullLiteral,
  ].includes(type);
}

function isOperator(type: RynixTokenClass): boolean {
  return [
    RynixTokenClass.PlusOp,
    RynixTokenClass.MinusOp,
    RynixTokenClass.MultiplyOp,
    RynixTokenClass.DivideOp,
    RynixTokenClass.ModuloOp,
    RynixTokenClass.EqualEqualOp,
    RynixTokenClass.NotEqualOp,
    RynixTokenClass.LessThanOp,
    RynixTokenClass.LessOrEqualOp,
    RynixTokenClass.GreaterThanOp,
    RynixTokenClass.GreaterOrEqualOp,
    RynixTokenClass.AndOp,
    RynixTokenClass.OrOp,
    RynixTokenClass.NotOp,
    RynixTokenClass.AssignmentOp,
  ].includes(type);
}

function isDelimiter(type: RynixTokenClass): boolean {
  return [
    RynixTokenClass.LParanthesis,
    RynixTokenClass.RParanthesis,
    RynixTokenClass.LBrace,
    RynixTokenClass.RBrace,
    RynixTokenClass.LBracket,
    RynixTokenClass.RBracket,
    RynixTokenClass.Colon,
    RynixTokenClass.Semicolon,
    RynixTokenClass.Comma,
    RynixTokenClass.Dot,
    RynixTokenClass.DotDot,
  ].includes(type);
}

function getTokenBadgeStyle(type: RynixTokenClass): string {
  if (isKeyword(type)) return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
  if (type === RynixTokenClass.Identifier) return 'bg-sky-950/80 text-sky-300 border-sky-800';
  if (type === RynixTokenClass.IntConstant || type === RynixTokenClass.FloatConstant)
    return 'bg-amber-950/80 text-amber-300 border-amber-800';
  if (type === RynixTokenClass.StringLiteral || type === RynixTokenClass.CharLiteral)
    return 'bg-purple-950/80 text-purple-300 border-purple-800';
  if (isOperator(type)) return 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
  if (isDelimiter(type)) return 'bg-slate-800 text-slate-300 border-slate-700';
  if (type === RynixTokenClass.SingleLineComment || type === RynixTokenClass.MultiLineComment)
    return 'bg-teal-950/80 text-teal-300 border-teal-800';
  if (type === RynixTokenClass.Unknown) return 'bg-rose-950 text-rose-300 border-rose-800';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}
