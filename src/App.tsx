import { useState, useEffect, useRef } from 'react';
import { Program, RunResult } from './types';
import { fetchPrograms, fetchProgram, createProgram, updateProgram, deleteProgram, runProgram } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { OutputPanel } from './components/OutputPanel';
import { NewProgramModal } from './components/NewProgramModal';
import { BentoOverview } from './components/BentoOverview';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Play, Save, Code2, Menu, Star, LayoutGrid, ChevronRight, Folder } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  
  const [code, setCode] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newModalFolder, setNewModalFolder] = useState<string>('src/scratchpad');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('mycpp-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
          { token: 'keyword', foreground: '111827', fontStyle: 'bold' },
          { token: 'string', foreground: '059669' },
          { token: 'number', foreground: 'd97706' },
          { token: 'identifier', foreground: '374151' }
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.lineHighlightBackground': '#f4f4f5',
          'editorLineNumber.foreground': '#d4d4d8',
          'editorIndentGuide.background': '#f4f4f5',
          'editorSuggestWidget.background': '#ffffff',
          'editorSuggestWidget.border': '#e4e4e7',
        }
      });
      monaco.editor.setTheme('mycpp-light');
    }
  }, [monaco]);

  const loadPrograms = async () => {
    try {
      const data = await fetchPrograms();
      setPrograms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleSelectProgram = async (id: string) => {
    if (!isSaved && activeId !== id) {
      if (activeProgram) {
        await handleSave(activeProgram, code);
      }
    }
    
    setIsMobileSidebarOpen(false);

    try {
      const prog = await fetchProgram(id);
      setActiveProgram(prog);
      setActiveId(id);
      setCode(prog.content || '');
      setIsSaved(true);
      setRunResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProgram = async (name: string, content?: string, folder?: string) => {
    try {
      const prog = await createProgram(name, content, folder || newModalFolder);
      await loadPrograms();
      handleSelectProgram(prog.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await deleteProgram(id);
      if (activeId === id) {
        setActiveId(null);
        setActiveProgram(null);
        setCode('');
      }
      await loadPrograms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    try {
      await updateProgram(id, { is_favorite: isFav ? 1 : 0 });
      await loadPrograms();
      if (activeProgram && activeProgram.id === id) {
        setActiveProgram(prev => prev ? { ...prev, is_favorite: isFav ? 1 : 0 } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
    setIsSaved(false);
  };

  const handleSave = async (prog = activeProgram, currentCode = code) => {
    if (!prog) return;
    setIsSaving(true);
    try {
      await updateProgram(prog.id, { content: currentCode });
      setIsSaved(true);
      setTimeout(() => setIsSaving(false), 400);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!activeProgram || isRunning) return;
    
    if (!isSaved) {
      await handleSave();
    }
    
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await runProgram(activeProgram.id);
      setRunResult(res);
    } catch (err) {
      setRunResult({
        success: false,
        compileOutput: '',
        runOutput: String(err),
        exitCode: 1,
        timeMs: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Global Keyboard Shortcuts (Cmd+S / Ctrl+S and Cmd+Enter / Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, activeProgram, isSaved, isRunning]);

  // Clean folder breadcrumb computation
  const currentFolderName = activeProgram?.folder 
    ? activeProgram.folder.replace('src/', '') 
    : 'scratchpad';

  return (
    <div className="flex h-screen bg-[#F7F5F0] text-[#1E1E1E] overflow-hidden p-2.5 sm:p-3 gap-2.5 sm:gap-3">
      
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* File Explorer Tree Sidebar */}
      <Sidebar 
        programs={programs}
        activeId={activeId}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onSelect={handleSelectProgram}
        onCreateNew={(initialFolder) => {
          setNewModalFolder(initialFolder || 'src/scratchpad');
          setIsNewModalOpen(true);
        }}
        onDelete={handleDeleteProgram}
        onToggleFavorite={handleToggleFavorite}
        onHome={() => {
          setActiveId(null);
          setActiveProgram(null);
        }}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white rounded-[28px] shadow-xs relative border border-[#EBE8DF]">
        {activeProgram ? (
          <>
            {/* Header: Clean Breadcrumbs & Action Bar */}
            <header className="h-14 sm:h-16 bg-white border-b border-[#F4F2EB] flex items-center justify-between px-3 sm:px-5 shrink-0 z-10">
              
              {/* Left: Breadcrumbs navigation */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button 
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 text-[#1E1E1E] hover:bg-[#F7F5F0] rounded-lg md:hidden shrink-0"
                  title="Open Explorer"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setActiveId(null);
                    setActiveProgram(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1E1E1E]/70 hover:text-[#1E1E1E] hover:bg-[#F7F5F0] transition-colors shrink-0"
                  title="Back to Overview"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Overview</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-[#1E1E1E]/30 shrink-0" />

                {/* Folder Path */}
                <div className="flex items-center gap-1 text-xs text-[#1E1E1E]/60 font-medium shrink-0">
                  <Folder className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-mono text-[11px]">{currentFolderName}</span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-[#1E1E1E]/30 shrink-0" />

                {/* File Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-[#1E1E1E] truncate max-w-[140px] sm:max-w-xs font-mono">
                    {activeProgram.name.endsWith('.cpp') ? activeProgram.name : `${activeProgram.name}.cpp`}
                  </span>
                  
                  {activeProgram.is_favorite === 1 && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>

                <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[10px] font-bold text-[#1E1E1E]/50 uppercase tracking-wider">
                  <span className="bg-[#F7F5F0] px-2 py-0.5 rounded font-mono">{activeProgram.cpp_standard}</span>
                </div>
              </div>
              
              {/* Right: Status & Run Button */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
                  <AnimatePresence mode="wait">
                    {isSaving ? (
                      <motion.span 
                        key="saving" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="text-[#1E1E1E]/40 text-xs"
                      >
                        Saving...
                      </motion.span>
                    ) : isSaved ? (
                      <motion.span 
                        key="saved" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="text-zinc-400 text-xs flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Saved</span>
                      </motion.span>
                    ) : (
                      <motion.button 
                        key="unsaved" 
                        onClick={() => handleSave()}
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                        title="Click to save (⌘S)"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Save (⌘S)</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  onClick={handleRun}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs",
                    isRunning 
                      ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" 
                      : "bg-[#1E1E1E] text-white hover:bg-black hover:shadow-md"
                  )}
                  title="Compile & Run (⌘ + Enter)"
                >
                  {isRunning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Building...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-[#BED88D]" />
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Editor Canvas */}
            <div className="flex-1 relative bg-white overflow-hidden">
              <Editor
                height="100%"
                language="cpp"
                theme="mycpp-light"
                value={code}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                  lineHeight: 1.6,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  formatOnPaste: true,
                  renderLineHighlight: 'all',
                  wordWrap: 'on'
                }}
              />
            </div>
            
            {/* Standout Terminal Output Panel */}
            <OutputPanel 
              result={runResult} 
              isRunning={isRunning} 
              onClear={() => setRunResult(null)}
              cppStandard={activeProgram.cpp_standard}
            />
          </>
        ) : (
          <BentoOverview 
            programs={programs}
            onSelectProgram={handleSelectProgram}
            onCreateProgram={handleCreateProgram}
            onOpenNewModal={() => {
              setNewModalFolder('src/scratchpad');
              setIsNewModalOpen(true);
            }}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        )}
      </main>

      {/* New File Modal */}
      <NewProgramModal 
        isOpen={isNewModalOpen} 
        initialFolder={newModalFolder}
        onClose={() => setIsNewModalOpen(false)} 
        onSubmit={handleCreateProgram}
      />
    </div>
  );
}
