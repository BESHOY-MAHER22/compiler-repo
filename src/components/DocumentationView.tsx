import React, { useRef } from 'react';
import { Printer, ArrowLeft, Download, ExternalLink } from 'lucide-react';

interface DocumentationViewProps {
  onBack: () => void;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({ onBack }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleOpenNewTab = () => {
    window.open('/documentation.html', '_blank');
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-900 text-slate-100">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-950 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Rynix Scanner</span>
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">
              Milestone (1) Deliverables Report (A4 Printable Document)
            </h2>
            <p className="text-xs text-slate-400">
              Regular Expressions • Vector DFAs • Complete C# & Web Scanner Code
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title="Open standalone document in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print to PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Embedded Document Frame */}
      <div className="flex-1 w-full h-full bg-slate-800 min-h-0 relative">
        <iframe
          ref={iframeRef}
          src="/documentation.html"
          title="Milestone 1 Documentation"
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  );
};
