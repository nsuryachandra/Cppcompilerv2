import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code2, Folder, Sparkles } from 'lucide-react';
import { STARTER_TEMPLATES } from '../lib/templates';
import { cn } from '../lib/utils';

interface NewProgramModalProps {
  isOpen: boolean;
  initialFolder?: string;
  onClose: () => void;
  onSubmit: (name: string, content?: string, folder?: string) => void;
}

const FOLDERS = [
  { path: 'src/scratchpad', label: 'scratchpad' },
  { path: 'src/algorithms', label: 'algorithms' },
  { path: 'src/data_structures', label: 'data_structures' },
  { path: 'src/modern_cpp', label: 'modern_cpp' },
  { path: 'src/concurrency', label: 'concurrency' },
  { path: 'src/benchmarks', label: 'benchmarks' },
];

export function NewProgramModal({ isOpen, initialFolder = 'src/scratchpad', onClose, onSubmit }: NewProgramModalProps) {
  const [name, setName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(initialFolder);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedFolder(initialFolder || 'src/scratchpad');
      setSelectedTemplateId(null);
      setTimeout(() => inputRef.current?.focus(), 100);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, initialFolder, onClose]);

  const handleSelectTemplate = (id: string, templateName: string, templateFolder?: string) => {
    setSelectedTemplateId(id);
    if (!name.trim()) {
      setName(templateName);
    }
    if (templateFolder) {
      setSelectedFolder(templateFolder);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const template = selectedTemplateId 
        ? STARTER_TEMPLATES.find(t => t.id === selectedTemplateId) 
        : null;
      onSubmit(name.trim(), template?.content, selectedFolder);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1E1E1E]/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white shadow-2xl rounded-[32px] w-full max-w-md overflow-hidden p-6 sm:p-7 relative border border-white"
            >
              <div className="flex flex-col items-center justify-center pt-1 pb-1">
                <div className="w-14 h-14 rounded-full bg-[#B8A7EA] flex items-center justify-center shadow-xs mb-2.5">
                  <Code2 className="w-7 h-7 text-[#1E1E1E]" strokeWidth={2} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-bold text-[#1E1E1E]">
                  New C++ File
                </h2>
                <p className="text-xs text-[#1E1E1E]/60 mt-1 font-medium">Configure file location and starter template</p>
                
                <button 
                  onClick={onClose} 
                  className="absolute top-5 right-5 p-2 text-[#1E1E1E]/40 hover:text-[#1E1E1E] bg-[#F7F5F0] hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/50 mb-1 px-1">
                    File Name
                  </label>
                  <input 
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. quick_sort or graph_bfs"
                    className="w-full bg-[#F7F5F0] border-none rounded-xl px-4 py-3 text-sm text-[#1E1E1E] font-medium placeholder:text-[#1E1E1E]/40 focus:outline-none focus:ring-2 focus:ring-[#1E1E1E]/10 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/50 mb-1.5 px-1 flex items-center gap-1">
                    <Folder className="w-3 h-3 text-amber-600" />
                    <span>Target Folder</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FOLDERS.map(f => (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => setSelectedFolder(f.path)}
                        className={cn(
                          "text-[11px] font-medium px-2.5 py-1.5 rounded-lg text-left truncate transition-all flex items-center gap-1.5",
                          selectedFolder === f.path 
                            ? "bg-[#1E1E1E] text-white font-semibold shadow-xs" 
                            : "bg-[#F7F5F0] text-[#1E1E1E]/70 hover:bg-[#EBE8DF]"
                        )}
                      >
                        <span className="text-[10px] opacity-50">src/</span>
                        <span className="truncate">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/50">
                      Starter Blueprint (Optional)
                    </label>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId(null)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                      >
                        Reset to Blank
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_TEMPLATES.map(tmpl => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl.id, tmpl.name, tmpl.folder)}
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full transition-all flex items-center gap-1",
                            isSelected 
                              ? "bg-[#1E1E1E] text-white shadow-xs scale-[1.02]" 
                              : "bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#1E1E1E]"
                          )}
                        >
                          <span className="text-[9px] opacity-60 font-mono">{tmpl.badge}</span>
                          <span className="text-[11px]">{tmpl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-3 text-xs font-bold text-white bg-[#1E1E1E] hover:bg-black disabled:bg-[#F7F5F0] disabled:text-[#1E1E1E]/40 rounded-full transition-all active:scale-95 disabled:active:scale-100 uppercase tracking-wider shadow-xs mt-1"
                >
                  Create &amp; Open
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
