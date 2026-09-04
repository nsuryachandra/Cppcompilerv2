import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Terminal as TerminalIcon, 
  AlertCircle, 
  Copy, 
  Check, 
  RotateCcw, 
  Cpu,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Play,
  CornerDownLeft,
  Sparkles,
  Info,
  Send
} from 'lucide-react';
import { RunResult } from '../types';
import { cn } from '../lib/utils';
import { runSnippet } from '../lib/api';

export interface FileRunHistoryItem {
  id: string;
  runNumber: number;
  timestamp: string;
  stdin?: string;
  result: RunResult;
}

export interface TerminalTab {
  id: string;
  name: string;
  type: 'main' | 'interactive';
  history?: Array<{
    id: string;
    command: string;
    result?: RunResult;
    isRunning?: boolean;
    timestamp: string;
  }>;
}

interface OutputPanelProps {
  programId?: string;
  programName?: string;
  history: FileRunHistoryItem[];
  isRunning: boolean;
  onRunDirect: (stdinValue?: string) => void;
  onClearHistory: () => void;
  cppStandard?: string;
}

const QUICK_SNIPPETS = [
  { label: 'cout << "Hello!"', code: 'cout << "Hello from AiRus Terminal!" << endl;' },
  { label: '25 * 40', code: 'cout << "25 * 40 = " << 25 * 40 << endl;' },
  { label: 'vector loop', code: 'vector<int> v = {3, 1, 4, 1, 5}; sort(v.begin(), v.end()); for(int x : v) cout << x << " ";' },
  { label: 'sqrt(144)', code: 'cout << "sqrt(144) = " << sqrt(144) << endl;' },
  { label: 'lambda', code: 'auto sq = [](int x){ return x*x; }; cout << "sq(7) = " << sq(7);' }
];

export function OutputPanel({ 
  programId,
  programName,
  history, 
  isRunning, 
  onRunDirect,
  onClearHistory, 
  cppStandard = 'C++23' 
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  
  // Height & Resizing state
  const [height, setHeight] = useState<number>(290);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Ref for tracking drag calculations
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(290);

  // Terminal Tabs State
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'main', name: 'Terminal Output', type: 'main' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('main');

  // Direct Interactive Stdin on Main Terminal
  const [directInput, setDirectInput] = useState('');
  const mainInputRef = useRef<HTMLInputElement>(null);

  // Interactive Snippet Terminal Input State
  const [snippetInput, setSnippetInput] = useState('');
  const [isExecutingSnippet, setIsExecutingSnippet] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const snippetInputRef = useRef<HTMLInputElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  // Auto switch to main tab when program is running
  useEffect(() => {
    if (isRunning) {
      setActiveTabId('main');
      setIsCollapsed(false);
    }
  }, [isRunning]);

  // Scroll to bottom when new output appears in active tab
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [history, isRunning, tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Submit direct input for the C++ program (cin / scanf)
  const handleSendDirectInput = () => {
    if (isRunning) return;
    const val = directInput;
    onRunDirect(val);
    setDirectInput('');
    setTimeout(() => {
      mainInputRef.current?.focus();
    }, 50);
  };

  // Add a new interactive terminal tab
  const handleAddTerminal = () => {
    const nextNum = tabs.filter(t => t.type === 'interactive').length + 1;
    const newId = `term_${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      name: `C++ Runner ${nextNum}`,
      type: 'interactive',
      history: [
        {
          id: 'welcome',
          command: '// Direct C++23 Runner initialized. Type any expression or lines to run:',
          result: {
            success: true,
            compileOutput: 'Success',
            runOutput: 'AiRus Direct C++ Engine ready. Type `cout << 2 + 2;` or any C++ code below.',
            exitCode: 0,
            timeMs: 1
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setIsCollapsed(false);
    setTimeout(() => {
      snippetInputRef.current?.focus();
    }, 100);
  };

  // Close an extra terminal tab
  const handleCloseTab = (e: React.MouseEvent, idToClose: string) => {
    e.stopPropagation();
    if (idToClose === 'main') return;

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== idToClose);
      if (activeTabId === idToClose) {
        setActiveTabId('main');
      }
      return filtered;
    });
  };

  // Clear active tab
  const handleClearCurrentTab = () => {
    if (activeTab.type === 'main') {
      onClearHistory();
    } else {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return { ...t, history: [] };
        }
        return t;
      }));
    }
  };

  // Execute snippet in interactive terminal
  const handleRunSnippet = async (codeToRun?: string) => {
    const snippet = (codeToRun !== undefined ? codeToRun : snippetInput).trim();
    if (!snippet || isExecutingSnippet) return;

    setCommandHistory(prev => [snippet, ...prev.filter(c => c !== snippet)]);
    setHistoryIndex(-1);
    setSnippetInput('');
    setIsExecutingSnippet(true);

    const entryId = `cmd_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          history: [
            ...(t.history || []),
            {
              id: entryId,
              command: snippet,
              isRunning: true,
              timestamp
            }
          ]
        };
      }
      return t;
    }));

    try {
      const res = await runSnippet(snippet, cppStandard, directInput);
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            history: (t.history || []).map(item => {
              if (item.id === entryId) {
                return {
                  ...item,
                  isRunning: false,
                  result: res
                };
              }
              return item;
            })
          };
        }
        return t;
      }));
    } catch (err) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            history: (t.history || []).map(item => {
              if (item.id === entryId) {
                return {
                  ...item,
                  isRunning: false,
                  result: {
                    success: false,
                    compileOutput: '',
                    runOutput: `Execution error: ${String(err)}`,
                    exitCode: 1,
                    timeMs: 0
                  }
                };
              }
              return item;
            })
          };
        }
        return t;
      }));
    } finally {
      setIsExecutingSnippet(false);
      setTimeout(() => {
        snippetInputRef.current?.focus();
      }, 50);
    }
  };

  const handleCopy = () => {
    if (activeTab.type === 'main') {
      if (history.length === 0) return;
      const allRuns = history.map(h => {
        const out = h.result.compileOutput !== 'Success' && h.result.compileOutput.trim()
          ? h.result.compileOutput
          : h.result.runOutput || 'Program exited with code 0';
        return `[Run #${h.runNumber} - ${h.timestamp}]\n${h.stdin ? `input: ${h.stdin}\n` : ''}${out}`;
      }).join('\n\n' + '='.repeat(40) + '\n\n');
      navigator.clipboard.writeText(allRuns);
    } else {
      const logs = (activeTab.history || []).map(h => {
        const out = h.result?.runOutput || h.result?.compileOutput || '';
        return `> ${h.command}\n${out}`;
      }).join('\n\n');
      navigator.clipboard.writeText(logs);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mouse Drag Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = isCollapsed ? 38 : height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = dragStartYRef.current - moveEvent.clientY;
      const maxHeight = Math.min(window.innerHeight * 0.8, 650);
      const minHeight = 120;
      const newHeight = Math.max(minHeight, Math.min(dragStartHeightRef.current + delta, maxHeight));
      
      setHeight(newHeight);
      setIsCollapsed(false);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Drag Handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartYRef.current = e.touches[0].clientY;
    dragStartHeightRef.current = isCollapsed ? 38 : height;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const delta = dragStartYRef.current - moveEvent.touches[0].clientY;
      const maxHeight = Math.min(window.innerHeight * 0.8, 550);
      const minHeight = 120;
      const newHeight = Math.max(minHeight, Math.min(dragStartHeightRef.current + delta, maxHeight));
      
      setHeight(newHeight);
      setIsCollapsed(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const setPreset = (targetHeight: number) => {
    setIsCollapsed(false);
    setHeight(targetHeight);
  };

  // Helper to render output with user input naturally inline (e.g. name: surya)
  const renderInteractiveRunOutput = (run: FileRunHistoryItem) => {
    const out = typeof run?.result?.runOutput === 'string' ? run.result.runOutput : '';
    const cleanStdin = typeof run?.stdin === 'string' ? run.stdin.trim() : '';

    if (!cleanStdin || !out) {
      return (
        <pre className="text-[#E2E8F0] whitespace-pre-wrap font-mono text-[13px] leading-relaxed selection:bg-emerald-500/30 py-0.5">
          {out || (run?.result?.exitCode === 0 ? '(Program finished with exit code 0 and produced no standard output)' : '')}
        </pre>
      );
    }

    const lines = out.split('\n');
    const firstLine = typeof lines[0] === 'string' ? lines[0] : '';
    const restLines = lines.slice(1);
    const trimmedPrompt = typeof firstLine === 'string' ? firstLine.trim() : '';

    const isPrompt = trimmedPrompt.endsWith(':') || 
                     trimmedPrompt.endsWith('?') || 
                     trimmedPrompt.toLowerCase().includes('enter') || 
                     trimmedPrompt.toLowerCase().includes('name') ||
                     trimmedPrompt.toLowerCase().includes('length') ||
                     trimmedPrompt.toLowerCase().includes('input');

    if (isPrompt && !firstLine.includes(cleanStdin)) {
      return (
        <div className="font-mono text-[13px] leading-relaxed selection:bg-emerald-500/30 py-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#E2E8F0]">{firstLine}</span>
            <span className="text-emerald-300 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
              {cleanStdin}
            </span>
          </div>
          {restLines.length > 0 && (
            <pre className="text-[#E2E8F0] whitespace-pre-wrap mt-1">{restLines.join('\n')}</pre>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1 font-mono text-[13px] leading-relaxed selection:bg-emerald-500/30 py-0.5">
        <pre className="text-[#E2E8F0] whitespace-pre-wrap">{out}</pre>
      </div>
    );
  };

  return (
    <div 
      style={{ height: isCollapsed ? '38px' : `${height}px` }}
      className={cn(
        "bg-[#181A22] text-[#E2E8F0] flex flex-col font-mono z-20 border-t border-[#2A2E3C] shadow-lg relative select-text transition-[height] duration-75 ease-out",
        isDragging && "select-none duration-0"
      )}
    >
      {/* Interactive Top Drag Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="group absolute -top-1.5 inset-x-0 h-3 cursor-row-resize flex items-center justify-center z-30 touch-none select-none"
        title="Drag up or down to resize terminal"
      >
        <div className={cn(
          "w-12 h-1 rounded-full transition-all duration-150",
          isDragging 
            ? "bg-[#10B981] w-16 h-1.5 shadow-sm shadow-[#10B981]/50" 
            : "bg-[#383E50] group-hover:bg-[#606980] group-hover:w-14"
        )} />
      </div>

      {/* Terminal Titlebar & Tabs */}
      <div 
        className="flex items-center justify-between px-2 sm:px-3 h-[38px] bg-[#1E212B] border-b border-[#2A2E3C] shrink-0 select-none cursor-default gap-2"
      >
        {/* Left: Collapse toggle + Tabs */}
        <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
          {/* Collapse icon */}
          <button 
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-[#282C38] text-[#94A3B8] hover:text-white rounded transition-colors shrink-0"
            title={isCollapsed ? "Expand terminal" : "Collapse terminal"}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setIsCollapsed(false);
                    if (tab.type === 'interactive') {
                      setTimeout(() => snippetInputRef.current?.focus(), 100);
                    } else {
                      setTimeout(() => mainInputRef.current?.focus(), 100);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all shrink-0 group border",
                    isActive
                      ? "bg-[#282D3D] text-white border-[#3F475D] shadow-xs"
                      : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#232733] border-transparent"
                  )}
                >
                  {tab.type === 'main' ? (
                    <TerminalIcon className="w-3 h-3 text-[#34D399] shrink-0" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  )}

                  <span className="truncate max-w-[120px] sm:max-w-none">{tab.name}</span>

                  {/* Main Tab Run Count Badge */}
                  {tab.type === 'main' && history.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#1A1D27] border border-[#373E52] text-[#94A3B8] rounded text-[9px] font-bold">
                      {history.length}
                    </span>
                  )}

                  {/* Running Spinner on Main */}
                  {tab.type === 'main' && isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
                  )}

                  {/* Close button for extra terminals */}
                  {tab.type === 'interactive' && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className="p-0.5 hover:bg-[#383E50] rounded text-[#64748B] hover:text-white transition-colors ml-0.5"
                      title="Close Terminal"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* ADD TERMINAL BUTTON */}
            <button
              type="button"
              onClick={handleAddTerminal}
              className="flex items-center gap-1 px-2 py-1 bg-[#232733] hover:bg-[#2F3547] text-[#94A3B8] hover:text-white rounded-md text-[11px] font-semibold border border-[#303648] transition-all shrink-0 active:scale-95"
              title="Add Direct C++ Runner Terminal"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Add Terminal</span>
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs shrink-0">
          {/* Quick Size Presets */}
          <div className="hidden md:flex items-center gap-1 bg-[#181A22] p-0.5 rounded-md border border-[#2A2E3C] text-[10px] font-semibold text-[#858E9E]">
            <button
              type="button"
              onClick={() => setPreset(180)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height <= 210 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setPreset(290)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height > 210 && height < 400 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setPreset(440)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height >= 400 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
            >
              Large
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 hover:bg-[#282C38] text-[#94A3B8] hover:text-white rounded-md transition-colors"
              title="Copy output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleClearCurrentTab}
              className="p-1.5 hover:bg-[#282C38] text-[#94A3B8] hover:text-white rounded-md transition-colors"
              title="Clear terminal history for this file"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Screen Body */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#161820]">
          {activeTab.type === 'main' ? (
            /* ========================================================================= */
            /* TAB 1: MAIN TERMINAL WITH DIRECT INLINE INPUT (CIN / SCANF)              */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 justify-between">
              {/* Output Scrollable Area */}
              <div 
                ref={terminalScrollRef}
                className="flex-1 overflow-auto p-3 sm:p-4 custom-scrollbar text-[12.5px] leading-relaxed font-mono select-text space-y-4"
              >
                {/* Ready Starter Notice */}
                {history.length === 0 && !isRunning && (
                  <div className="flex flex-col justify-between text-[#64748B] py-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <span className="text-emerald-400 font-semibold">AiRus GCC / G++ Live Runner</span>
                      <span>•</span>
                      <span className="text-zinc-400">{cppStandard}</span>
                      <span>•</span>
                      <span className="text-emerald-400/80 font-mono text-[11px]">{programName || 'Active File'}</span>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-[#94A3B8] text-xs">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span>Click <strong className="text-[#E2E8F0] font-semibold">"Run Code"</strong> or enter your inputs directly in the prompt below.</span>
                    </div>
                  </div>
                )}

                {/* Render each historical run for this file */}
                {history.map((run, idx) => {
                  const isCompileErr = run.result.compileOutput !== 'Success' && !run.result.success && run.result.compileOutput.trim().length > 0;
                  return (
                    <div 
                      key={run.id || idx} 
                      className="space-y-2 pb-3 border-b border-[#252A38] last:border-0"
                    >
                      {/* Run Header */}
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-[#202430]">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">❯</span>
                          <span className="text-white font-bold">./a.out</span>
                          <span className="px-1.5 py-0.2 bg-[#232838] text-emerald-300 rounded text-[10px] font-bold">
                            Run #{run.runNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B]">{run.timestamp}</span>
                      </div>

                      {/* Output Content with user input naturally inline */}
                      {isCompileErr ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Compiler Diagnostics:</span>
                          </div>
                          <div className="bg-[#24171A] border border-rose-500/25 rounded-xl p-3 text-rose-200 whitespace-pre-wrap font-mono text-xs leading-relaxed selection:bg-rose-500/30">
                            {run.result.compileOutput}
                          </div>
                        </div>
                      ) : (
                        renderInteractiveRunOutput(run)
                      )}

                      {/* Run Status Footer */}
                      <div className="pt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                        <span className={cn(
                          "flex items-center gap-1 font-semibold text-[11px]",
                          run.result.exitCode === 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {run.result.exitCode === 0 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>Exited with code {run.result.exitCode} in {run.result.timeMs}ms</span>
                        </span>
                        <span className="text-[#64748B] text-[10px] font-mono">ISO {cppStandard}</span>
                      </div>
                    </div>
                  );
                })}

                {/* In-progress Active Spinner */}
                {isRunning && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-[#94A3B8] border-t border-[#252A38]">
                    <div className="relative">
                      <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                      <Cpu className="w-3 h-3 text-emerald-400 absolute inset-0 m-auto" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#CBD5E1]">g++ -std={cppStandard.toLowerCase()} {programName || 'main.cpp'}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Compiling and running...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* DIRECT TERMINAL INTERACTIVE PROMPT BAR (AT BOTTOM OF TERMINAL) */}
              <div className="p-2.5 bg-[#171922] border-t border-[#252A38] shrink-0">
                <div className="flex items-center gap-2 bg-[#1E2230] border border-[#2F364B] focus-within:border-emerald-500/80 rounded-xl px-3 py-1.5 shadow-inner transition-colors">
                  <span className="text-emerald-400 font-bold text-sm select-none">❯</span>
                  <input
                    ref={mainInputRef}
                    type="text"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendDirectInput();
                      }
                    }}
                    disabled={isRunning}
                    placeholder='Type input for cin/scanf (e.g. surya or 25 40) and press Enter ↵'
                    className="flex-1 bg-transparent border-0 outline-hidden text-[#E2E8F0] placeholder-[#64748B] text-xs font-mono"
                  />
                  
                  <button
                    type="button"
                    onClick={handleSendDirectInput}
                    disabled={isRunning}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 shadow-xs cursor-pointer",
                      directInput.trim()
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                        : "bg-[#282E40] hover:bg-[#32394E] text-[#94A3B8] hover:text-white"
                    )}
                    title="Send input and run"
                  >
                    <span>{directInput.trim() ? "Send & Run" : "Run"}</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2+: DIRECT C++ RUNNER / INTERACTIVE SNIPPET TERMINAL                 */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 justify-between">
              {/* Output & Execution History */}
              <div className="flex-1 overflow-auto p-3 sm:p-4 custom-scrollbar text-[12.5px] leading-relaxed font-mono select-text space-y-3">
                {(activeTab.history || []).length === 0 ? (
                  <div className="text-[#64748B] py-2 text-xs">
                    Terminal ready. Type any C++ code (e.g. <code className="text-emerald-400">cout &lt;&lt; 2 + 2;</code>) below and press Enter.
                  </div>
                ) : (
                  (activeTab.history || []).map((item) => (
                    <div key={item.id} className="space-y-1.5 pb-2 border-b border-[#232735] last:border-0">
                      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-emerald-400 font-bold">❯</span>
                          <span className="text-[#E2E8F0] font-semibold truncate selection:bg-emerald-500/30">
                            {item.command}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B] shrink-0 ml-2">{item.timestamp}</span>
                      </div>

                      {item.isRunning ? (
                        <div className="flex items-center gap-2 text-xs text-amber-300 py-1 pl-4">
                          <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                          <span>Compiling snippet...</span>
                        </div>
                      ) : item.result ? (
                        <div className="pl-4">
                          {item.result.success ? (
                            <div>
                              {item.result.runOutput ? (
                                <pre className="text-emerald-200/90 whitespace-pre-wrap text-xs selection:bg-emerald-500/30">
                                  {item.result.runOutput}
                                </pre>
                              ) : (
                                <div className="text-[#64748B] italic text-[11px]">
                                  (Executed successfully with no output)
                                </div>
                              )}
                              <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>{item.result.timeMs}ms</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <pre className="text-rose-300 bg-[#25181C] p-2 rounded-lg border border-rose-500/20 text-xs whitespace-pre-wrap selection:bg-rose-500/30">
                                {item.result.compileOutput || item.result.runOutput || 'Execution failed.'}
                              </pre>
                              <div className="text-[10px] text-rose-400 flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" />
                                <span>Exit code {item.result.exitCode}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Interactive Prompt & Quick Examples */}
              <div className="p-2.5 bg-[#171922] border-t border-[#252A38] shrink-0 space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                  <span className="text-[#64748B] font-semibold shrink-0">Quick:</span>
                  {QUICK_SNIPPETS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRunSnippet(chip.code)}
                      className="px-2 py-0.5 rounded bg-[#202533] hover:bg-[#2B3145] text-[#94A3B8] hover:text-white border border-[#2D3344] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                      title={`Run: ${chip.code}`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-[#1E2230] border border-[#2F364B] focus-within:border-emerald-500/80 rounded-xl px-3 py-1.5 shadow-inner transition-colors">
                  <span className="text-emerald-400 font-bold text-sm select-none">❯</span>
                  <input
                    ref={snippetInputRef}
                    type="text"
                    value={snippetInput}
                    onChange={(e) => setSnippetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRunSnippet();
                      }
                    }}
                    disabled={isExecutingSnippet}
                    placeholder="Type small C++ line e.g. cout << 5*10; or pow(2,8) and press Enter"
                    className="flex-1 bg-transparent border-0 outline-hidden text-[#E2E8F0] placeholder-[#64748B] text-xs font-mono"
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleRunSnippet()}
                    disabled={isExecutingSnippet || !snippetInput.trim()}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 active:scale-95",
                      snippetInput.trim() && !isExecutingSnippet
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                        : "bg-[#252A38] text-[#64748B] cursor-not-allowed"
                    )}
                    title="Run (Enter)"
                  >
                    {isExecutingSnippet ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Run</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
