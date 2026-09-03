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
  Code2,
  Trash2
} from 'lucide-react';
import { RunResult } from '../types';
import { cn } from '../lib/utils';
import { runSnippet } from '../lib/api';

export interface TerminalTab {
  id: string;
  name: string;
  type: 'main' | 'interactive';
  history: Array<{
    id: string;
    command: string;
    result?: RunResult;
    isRunning?: boolean;
    timestamp: string;
  }>;
}

interface OutputPanelProps {
  result: RunResult | null;
  isRunning: boolean;
  onClear?: () => void;
  cppStandard?: string;
}

const QUICK_SNIPPETS = [
  { label: 'cout << "Hello!"', code: 'cout << "Hello from AiRus Terminal!" << endl;' },
  { label: '25 * 40', code: 'cout << "25 * 40 = " << 25 * 40 << endl;' },
  { label: 'vector loop', code: 'vector<int> v = {3, 1, 4, 1, 5}; sort(v.begin(), v.end()); for(int x : v) cout << x << " ";' },
  { label: 'sqrt(144)', code: 'cout << "sqrt(144) = " << sqrt(144) << endl;' },
  { label: 'lambda', code: 'auto sq = [](int x){ return x*x; }; cout << "sq(7) = " << sq(7);' }
];

export function OutputPanel({ result, isRunning, onClear, cppStandard = 'C++23' }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  
  // Height & Resizing state
  const [height, setHeight] = useState<number>(240);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Ref for tracking drag calculations
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(240);

  // Terminal Tabs State
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: 'main', name: 'Main (Build & Run)', type: 'main', history: [] },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('main');

  // Interactive Terminal Input State
  const [inputValue, setInputValue] = useState('');
  const [isExecutingSnippet, setIsExecutingSnippet] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
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
  }, [result, tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

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
      inputRef.current?.focus();
    }, 100);
  };

  // Close an extra terminal tab
  const handleCloseTab = (e: React.MouseEvent, idToClose: string) => {
    e.stopPropagation();
    if (idToClose === 'main') return; // Cannot close main build terminal

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== idToClose);
      if (activeTabId === idToClose) {
        setActiveTabId(filtered[filtered.length - 1]?.id || 'main');
      }
      return filtered;
    });
  };

  // Clear active tab
  const handleClearCurrentTab = () => {
    if (activeTab.type === 'main') {
      onClear?.();
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
    const snippet = (codeToRun !== undefined ? codeToRun : inputValue).trim();
    if (!snippet || isExecutingSnippet) return;

    // Add to local history for arrow navigation
    setCommandHistory(prev => [snippet, ...prev.filter(c => c !== snippet)]);
    setHistoryIndex(-1);
    setInputValue('');
    setIsExecutingSnippet(true);

    const entryId = `cmd_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Optimistically add entry with running state
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          history: [
            ...t.history,
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
      const res = await runSnippet(snippet, cppStandard);
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            history: t.history.map(item => {
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
            history: t.history.map(item => {
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
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Input key navigation (Enter to run, Up/Down for command history)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunSnippet();
    } else if (e.key === 'ArrowUp') {
      if (commandHistory.length > 0) {
        e.preventDefault();
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setInputValue(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (commandHistory.length > 0) {
        e.preventDefault();
        const nextIdx = Math.max(historyIndex - 1, -1);
        setHistoryIndex(nextIdx);
        setInputValue(nextIdx === -1 ? '' : commandHistory[nextIdx]);
      }
    }
  };

  const handleCopy = () => {
    if (activeTab.type === 'main') {
      if (!result) return;
      const textToCopy = result.compileOutput !== 'Success' && result.compileOutput.trim()
        ? result.compileOutput
        : result.runOutput || 'Program exited with code 0';
      navigator.clipboard.writeText(textToCopy);
    } else {
      const logs = activeTab.history.map(h => {
        const out = h.result?.runOutput || h.result?.compileOutput || '';
        return `> ${h.command}\n${out}`;
      }).join('\n\n');
      navigator.clipboard.writeText(logs);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCompileError = result && result.compileOutput !== 'Success' && !result.success && result.compileOutput.trim().length > 0;

  // Mouse Drag Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = isCollapsed ? 38 : height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = dragStartYRef.current - moveEvent.clientY;
      const maxHeight = Math.min(window.innerHeight * 0.75, 620);
      const minHeight = 110;
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
      const maxHeight = Math.min(window.innerHeight * 0.75, 550);
      const minHeight = 110;
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

      {/* Terminal Titlebar & Multi-Terminal Tabs Header */}
      <div 
        className="flex items-center justify-between px-2 sm:px-3 h-[38px] bg-[#1E212B] border-b border-[#2A2E3C] shrink-0 select-none cursor-default gap-2"
      >
        {/* Left: Collapse toggle + Terminal Tabs + Add Tab button */}
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

          {/* Terminal Tabs */}
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
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all shrink-0 group border",
                    isActive
                      ? "bg-[#282D3D] text-white border-[#3F475D] shadow-xs"
                      : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#232733] border-transparent"
                  )}
                  title={tab.name}
                >
                  {tab.type === 'main' ? (
                    <TerminalIcon className="w-3 h-3 text-[#34D399] shrink-0" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  )}

                  <span className="truncate max-w-[120px] sm:max-w-none">{tab.name}</span>

                  {/* Status indicator on tab */}
                  {tab.type === 'main' && (
                    isRunning ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
                    ) : result ? (
                      result.success ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-0.5" />
                      )
                    ) : null
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

        {/* Right: Presets, Clear, Copy, Resize Controls */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs shrink-0">
          {/* Quick Size Presets */}
          <div className="hidden md:flex items-center gap-1 bg-[#181A22] p-0.5 rounded-md border border-[#2A2E3C] text-[10px] font-semibold text-[#858E9E]">
            <button
              type="button"
              onClick={() => setPreset(140)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height <= 170 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
              title="Compact size"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setPreset(240)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height > 170 && height < 340 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
              title="Default size"
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setPreset(380)}
              className={cn(
                "px-2 py-0.5 rounded transition-colors",
                !isCollapsed && height >= 340 ? "bg-[#2A2E3C] text-white" : "hover:text-white"
              )}
              title="Large size"
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
              title="Clear terminal output"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Screen Body */}
      {!isCollapsed && (
        <div 
          ref={terminalScrollRef}
          className="flex-1 overflow-auto p-3 sm:p-4 custom-scrollbar text-[12.5px] leading-relaxed bg-[#161820] font-mono select-text flex flex-col justify-between"
        >
          {activeTab.type === 'main' ? (
            /* ========================================================================= */
            /* TAB 1: MAIN BUILD & RUN TAB                                              */
            /* ========================================================================= */
            <div>
              {isRunning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-[#94A3B8]">
                  <div className="relative">
                    <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                    <Cpu className="w-3.5 h-3.5 text-emerald-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[#CBD5E1]">g++ -std={cppStandard.toLowerCase()} -O3 main.cpp</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Compiling and running...</p>
                  </div>
                </div>
              ) : !result ? (
                <div className="flex flex-col justify-between text-[#64748B] py-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="text-emerald-400 font-semibold">AiRus GCC 12.3</span>
                    <span>•</span>
                    <span>x86_64 Linux container</span>
                    <span>•</span>
                    <span className="text-zinc-400">{cppStandard}</span>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-[#94A3B8] text-xs">
                    <span className="text-emerald-400 font-bold">$</span>
                    <span>Ready. Click <strong className="text-[#E2E8F0] font-semibold">"Run Code"</strong> or press <kbd className="px-1.5 py-0.5 bg-[#202430] border border-[#2F3445] rounded text-[10px] text-[#CBD5E1]">⌘ + Enter</kbd></span>
                  </div>
                  <div className="pt-2 text-[11px] text-[#64748B]">
                    Want to test small lines or one-liners? Click <button onClick={handleAddTerminal} className="text-emerald-400 underline hover:text-emerald-300 font-semibold">+ Add Terminal</button> above!
                  </div>
                </div>
              ) : isCompileError ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold pb-1.5 border-b border-rose-500/20">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Compiler Diagnostic Messages:</span>
                  </div>
                  <div className="bg-[#24171A] border border-rose-500/25 rounded-xl p-3 text-rose-200 whitespace-pre-wrap font-mono text-xs leading-relaxed selection:bg-rose-500/30">
                    {result.compileOutput}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Tip: Check missing semi-colons, include headers, or dialect syntax incompatibilities.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[#64748B] text-xs flex items-center gap-2 pb-1 border-b border-[#252A38]">
                    <span className="text-emerald-400 font-bold">❯</span>
                    <span>./a.out</span>
                  </div>

                  {result.runOutput ? (
                    <pre className="text-[#E2E8F0] whitespace-pre-wrap font-mono text-[13px] leading-relaxed selection:bg-emerald-500/30 py-0.5">
                      {result.runOutput}
                    </pre>
                  ) : (
                    <div className="text-[#64748B] italic text-xs py-1">
                      (Program finished with exit code 0 and produced no standard output)
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#252A38] flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className={cn(
                      "flex items-center gap-1 font-semibold",
                      result.exitCode === 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {result.exitCode === 0 ? '✔' : '✖'} Exited with code {result.exitCode} in {result.timeMs}ms
                    </span>
                    <span className="text-[#64748B] text-[10px]">ISO {cppStandard}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2+: DIRECT C++ RUNNER / INTERACTIVE TERMINAL                         */
            /* ========================================================================= */
            <div className="flex flex-col h-full justify-between gap-3">
              {/* Output & Execution History */}
              <div className="space-y-3 overflow-y-auto pr-1">
                {activeTab.history.length === 0 ? (
                  <div className="text-[#64748B] py-2 text-xs">
                    Terminal ready. Type any C++ code (e.g. <code className="text-emerald-400">cout &lt;&lt; 2 + 2;</code>) below and press Enter.
                  </div>
                ) : (
                  activeTab.history.map((item) => (
                    <div key={item.id} className="space-y-1.5 pb-2 border-b border-[#232735] last:border-0">
                      {/* Command prompt line */}
                      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-emerald-400 font-bold">❯</span>
                          <span className="text-[#E2E8F0] font-semibold truncate selection:bg-emerald-500/30">
                            {item.command}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#64748B] shrink-0 ml-2">{item.timestamp}</span>
                      </div>

                      {/* Execution result or running status */}
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
              <div className="pt-2 border-t border-[#252A38] bg-[#161820] shrink-0 space-y-2">
                {/* Quick Examples Pill Bar */}
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

                {/* Direct C++ Input Box */}
                <div className="flex items-center gap-2 bg-[#1C1F2B] border border-[#2D3345] focus-within:border-emerald-500/70 rounded-xl px-3 py-1.5 shadow-inner transition-colors">
                  <span className="text-emerald-400 font-bold text-sm select-none">❯</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isExecutingSnippet}
                    placeholder="Type small C++ line e.g. cout << 5*10; or pow(2,8) and press Enter"
                    className="flex-1 bg-transparent border-0 outline-hidden text-[#E2E8F0] placeholder-[#64748B] text-xs font-mono"
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleRunSnippet()}
                    disabled={isExecutingSnippet || !inputValue.trim()}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 active:scale-95",
                      inputValue.trim() && !isExecutingSnippet
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
