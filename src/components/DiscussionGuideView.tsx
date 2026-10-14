import React, { useRef } from 'react';
import { ArrowLeft, Printer, ExternalLink, HelpCircle } from 'lucide-react';

interface DiscussionGuideViewProps {
  onBack: () => void;
}

export const DiscussionGuideView: React.FC<DiscussionGuideViewProps> = ({ onBack }) => {
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
    window.open('/discussion_guide.html', '_blank');
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
            <span>رجوع للمحرر (Back to Scanner)</span>
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>دليل مناقشة كود C# وأسئلة الـ Viva (Team 36)</span>
            </h2>
            <p className="text-xs text-slate-400">
              شرح تفصيلي سطراً بسطر لكود Scanner.cs • أسئلة المناقشة المتوقعة وإجاباتها النموذجية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح كنافذة مستقلة</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الدليل (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* Embedded Document Frame */}
      <div className="flex-1 w-full h-full bg-slate-800 min-h-0 relative">
        <iframe
          ref={iframeRef}
          src="/discussion_guide.html"
          title="Compiler Discussion Guide"
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  );
};
