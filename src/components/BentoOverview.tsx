import React, { useState } from 'react';
import { Program } from '../types';
import { STARTER_TEMPLATES, TemplateItem } from '../lib/templates';
import { 
  Code2, 
  Sparkles, 
  Play, 
  Star, 
  Zap, 
  Layers, 
  Clock, 
  Plus, 
  Compass,
  ArrowRight,
  Terminal,
  Cpu,
  Bookmark,
  CheckCircle2,
  HardDrive,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  FileCode2,
  Box
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface BentoOverviewProps {
  programs: Program[];
  onSelectProgram: (id: string) => void;
  onCreateProgram: (name: string, content?: string, folder?: string) => void;
  onOpenNewModal: () => void;
  onOpenMobileSidebar: () => void;
}

export const BentoOverview: React.FC<BentoOverviewProps> = ({
  programs,
  onSelectProgram,
  onCreateProgram,
  onOpenNewModal,
  onOpenMobileSidebar
}) => {
  const [inboxTab, setInboxTab] = useState<'all' | 'starred'>('all');
  const [selectedStd, setSelectedStd] = useState<'c++17' | 'c++20' | 'c++23'>('c++23');
  const [optLevel, setOptLevel] = useState<'-O0' | '-O2' | '-O3'>('-O3');

  const favoritePrograms = programs.filter(p => p.is_favorite);
  const displayedPrograms = inboxTab === 'starred' 
    ? favoritePrograms.slice(0, 3) 
    : programs.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F5F0] overflow-y-auto custom-scrollbar relative p-4 sm:p-6 lg:p-8 selection:bg-[#FAD25C]/40">
      
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 sm:pb-8 pt-1 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenMobileSidebar}
            className="p-2.5 -ml-2 text-[#1E1E1E] hover:bg-black/5 rounded-full md:hidden transition-colors"
            title="Open Programs Drawer"
          >
            <Compass className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105">
              <Code2 className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="font-['Fraunces',serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#1E1E1E]">
                AiRus Compiler
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#1E1E1E]/50 uppercase -mt-0.5">
                Fast C++23 Compiler & Algorithm Workspace
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenNewModal}
            className="group flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-[#1E1E1E] hover:bg-black text-white rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
            <span>New Program</span>
          </button>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="max-w-6xl mx-auto w-full pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 auto-rows-[auto] grid-flow-dense">
          
          {/* ========================================================================= */}
          {/* 1. BLUEPRINTS / TEMPLATES (Col 1, Rows 1-2 on desktop) - Lavender         */}
          {/* ========================================================================= */}
          <div className="col-span-1 xl:col-span-1 xl:row-span-2 bg-[#B8A7EA] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group">
            {/* Ambient Background Blur */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-75" />

            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/70 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  Template Studio
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E1E1E]/30 group-hover:bg-[#1E1E1E]/60 transition-colors" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight leading-none">
                Blueprints
              </h3>
            </div>

            {/* Visual Center: Tilted Polaroid/Code Card + Floating Dock */}
            <div className="my-6 relative flex flex-col items-center justify-center">
              {/* Tilted Code Card */}
              <motion.div 
                whileHover={{ rotate: -0.5, scale: 1.02, y: -3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="w-full max-w-[280px] bg-white rounded-2xl shadow-xl p-4 transform -rotate-2 border border-white/90 relative"
              >
                {/* Badge Sticker */}
                <div className="absolute -top-3 -right-2 bg-[#FAD25C] text-[#1E1E1E] text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md rotate-12 flex items-center gap-1 border border-white transition-transform group-hover:rotate-6">
                  <Sparkles className="w-3 h-3 fill-current text-[#1E1E1E]" />
                  C++23
                </div>

                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F578A0]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FAD25C]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#BED88D]" />
                  <span className="text-[10px] font-mono text-zinc-400 ml-auto">ranges_view.cpp</span>
                </div>

                <div className="font-mono text-[11px] text-[#1E1E1E] space-y-1 bg-[#F7F5F0] rounded-xl p-3 border border-[#EBE8DF]">
                  <p className="text-purple-600 font-semibold">#include &lt;ranges&gt;</p>
                  <p className="text-zinc-500">// Modern C++23 pipeline</p>
                  <p className="text-blue-600">auto <span className="text-[#1E1E1E]">res = data</span></p>
                  <p className="text-[#1E1E1E] pl-2 font-semibold">| views::filter(is_even)</p>
                  <p className="text-[#1E1E1E] pl-2 font-semibold">| views::transform(square);</p>
                  <p className="text-emerald-600 mt-1 font-semibold">std::cout &lt;&lt; "Output ⚡";</p>
                </div>
              </motion.div>

              {/* Floating Frosted Toolbar Dock */}
              <div className="mt-4 w-full max-w-[290px] bg-white/90 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 shadow-lg border border-white/80 flex items-center justify-around text-[#1E1E1E]">
                <button 
                  type="button"
                  className="flex flex-col items-center gap-1 p-1.5 hover:bg-[#F7F5F0] active:scale-95 rounded-xl cursor-pointer transition-all" 
                  title="Ranges Pipeline" 
                  onClick={() => onCreateProgram('Modern Ranges', STARTER_TEMPLATES[0].content, STARTER_TEMPLATES[0].folder)}
                >
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-[9px] font-bold">Ranges</span>
                </button>
                <button 
                  type="button"
                  className="flex flex-col items-center gap-1 p-1.5 hover:bg-[#F7F5F0] active:scale-95 rounded-xl cursor-pointer transition-all" 
                  title="QuickSort Partition" 
                  onClick={() => onCreateProgram('QuickSort', STARTER_TEMPLATES[3].content, STARTER_TEMPLATES[3].folder)}
                >
                  <Cpu className="w-4 h-4 text-pink-600" />
                  <span className="text-[9px] font-bold">Sort</span>
                </button>
                <button 
                  type="button"
                  className="flex flex-col items-center gap-1 p-1.5 hover:bg-[#F7F5F0] active:scale-95 rounded-xl cursor-pointer transition-all" 
                  title="Binary Search Tree" 
                  onClick={() => onCreateProgram('Binary Tree', STARTER_TEMPLATES[1].content, STARTER_TEMPLATES[1].folder)}
                >
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <span className="text-[9px] font-bold">BST</span>
                </button>
                <button 
                  type="button"
                  className="flex flex-col items-center gap-1 p-1.5 hover:bg-[#F7F5F0] active:scale-95 rounded-xl cursor-pointer transition-all" 
                  title="Thread Concurrency" 
                  onClick={() => onCreateProgram('Thread Concurrency', STARTER_TEMPLATES[2].content, STARTER_TEMPLATES[2].folder)}
                >
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span className="text-[9px] font-bold">Threads</span>
                </button>
              </div>
            </div>

            {/* Bottom Copy */}
            <div>
              <p className="text-sm font-medium text-[#1E1E1E]/80 leading-relaxed">
                Jump straight into production-grade C++ patterns — concurrency workers, STL algorithms, and memory-safe trees.
              </p>
              <button 
                onClick={onOpenNewModal}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#1E1E1E] hover:opacity-80 transition-opacity group-hover:translate-x-0.5 duration-200"
              >
                Browse starter blueprints <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 2. TOOLCHAIN & COMPILER (Col 2-3 on desktop, Col 2 on tablet) - Pink      */}
          {/* ========================================================================= */}
          <div className="col-span-1 xl:col-span-2 bg-[#F578A0] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col xl:flex-row items-center justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group min-h-[270px]">
            {/* Ambient Accent */}
            <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/15 rounded-full blur-3xl pointer-events-none" />

            {/* Left Content */}
            <div className="w-full xl:w-1/2 z-10 xl:pr-4 mb-6 xl:mb-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/70 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">
                Native Toolchain
              </span>
              <h3 className="text-3xl sm:text-4xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight mt-2.5 leading-none">
                Compiler
              </h3>
              <p className="text-sm font-medium text-[#1E1E1E]/85 mt-3 leading-relaxed">
                Compile ISO C++ in isolated Linux containers using GCC 12.3 with fine-tuned optimization flags and zero cold-start delay.
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="bg-[#1E1E1E] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                  GCC 12.3
                </span>
                <span className="bg-white/40 text-[#1E1E1E] text-xs font-semibold px-3 py-1 rounded-full">
                  x86_64 Linux
                </span>
                <span className="bg-white/40 text-[#1E1E1E] text-xs font-semibold px-3 py-1 rounded-full">
                  -Wall -Wextra
                </span>
              </div>
            </div>

            {/* Right Visual: Angled Toolchain Config Card */}
            <div className="w-full xl:w-1/2 flex justify-center xl:justify-end relative">
              <motion.div 
                whileHover={{ y: -3, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-white rounded-[24px] p-4 sm:p-5 shadow-xl w-full max-w-[270px] border border-white/80 relative transform rotate-1 transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E]/60">Standard Dialect</span>
                  <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">READY</span>
                </div>

                {/* Dialect Switcher */}
                <div className="grid grid-cols-3 gap-1 bg-[#F7F5F0] p-1 rounded-xl mb-3">
                  {(['c++17', 'c++20', 'c++23'] as const).map(std => (
                    <button
                      key={std}
                      type="button"
                      onClick={() => setSelectedStd(std)}
                      className={`text-[10px] font-bold uppercase py-1 rounded-lg transition-all ${
                        selectedStd === std 
                          ? 'bg-[#1E1E1E] text-white shadow-xs' 
                          : 'text-[#1E1E1E]/60 hover:text-[#1E1E1E]'
                      }`}
                    >
                      {std}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-bold uppercase text-[#1E1E1E]/60">Optimization</span>
                  <div className="flex gap-1 font-mono text-[10px]">
                    {(['-O0', '-O2', '-O3'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setOptLevel(level)}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                          optLevel === level 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => onCreateProgram('Fast Benchmark', STARTER_TEMPLATES[5].content, STARTER_TEMPLATES[5].folder)}
                  className="w-full mt-2 py-2.5 bg-[#1E1E1E] hover:bg-black text-white rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Launch Benchmark ({selectedStd})</span>
                </button>
              </motion.div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 3. PERFORMANCE & TELEMETRY (Pistachio Green)                              */}
          {/* ========================================================================= */}
          <div className="bg-[#BED88D] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group min-h-[270px]">
            {/* Top Cards Stack: High Performance Dark Telemetry Monitor */}
            <div className="relative pt-1 pb-4">
              {/* Back Cards Peeking */}
              <div className="absolute top-0 right-4 w-44 h-24 bg-[#F578A0] rounded-2xl opacity-50 transform rotate-6 scale-95 shadow-sm" />
              <div className="absolute top-1 right-2 w-44 h-24 bg-[#FAD25C] rounded-2xl opacity-60 transform -rotate-3 scale-95 shadow-sm" />

              {/* Front Dark Card: Telemetry Console */}
              <motion.div 
                whileHover={{ scale: 1.02, rotate: -0.5 }}
                className="relative z-10 w-full bg-[#1E1E1E] text-white rounded-2xl p-4 shadow-xl border border-white/10"
              >
                <div className="flex items-center justify-between text-[11px] text-white/60 mb-2">
                  <span className="font-semibold tracking-wider uppercase text-[9px] flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-[#BED88D]" />
                    <span>Hardware Telemetry</span>
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#BED88D] animate-pulse" />
                </div>
                
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-['Fraunces',serif] font-bold text-white tracking-tight">
                    &lt; 0.8 ms
                  </span>
                  <span className="text-[9px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                    HIGH RES
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-white/60 font-mono">
                  <div>RAM: <span className="text-white font-semibold">3.8 MB</span></div>
                  <div className="text-right text-emerald-400 font-semibold">Exit: Code 0</div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Copy */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight leading-none">
                Telemetry
              </h3>
              <p className="text-sm font-medium text-[#1E1E1E]/80 mt-2 leading-snug">
                Precision nanosecond benchmarking with std::chrono and zero abstraction overhead.
              </p>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 4. PROGRAM WORKSPACE (Butter Yellow)                                      */}
          {/* ========================================================================= */}
          <div className="bg-[#FAD25C] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group min-h-[280px]">
            {/* Top Copy & Filter Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-white/40 p-0.5 rounded-full">
                  <button
                    type="button"
                    onClick={() => setInboxTab('all')}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-all",
                      inboxTab === 'all' 
                        ? "bg-[#1E1E1E] text-white shadow-xs" 
                        : "text-[#1E1E1E]/70 hover:text-[#1E1E1E]"
                    )}
                  >
                    Recent ({programs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxTab('starred')}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1",
                      inboxTab === 'starred' 
                        ? "bg-[#1E1E1E] text-white shadow-xs" 
                        : "text-[#1E1E1E]/70 hover:text-[#1E1E1E]"
                    )}
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>Starred ({favoritePrograms.length})</span>
                  </button>
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight leading-none mt-1">
                Workspace
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#1E1E1E]/80 mt-1.5 leading-snug">
                Your saved algorithms, data structures, and starred files.
              </p>
            </div>

            {/* Bottom Visual: High-Hierarchy Program List */}
            <div className="mt-4 bg-white rounded-2xl p-2 sm:p-2.5 shadow-lg border border-white/80 space-y-1">
              {displayedPrograms.length > 0 ? (
                displayedPrograms.map((prog, idx) => {
                  const initials = prog.name.slice(0, 2).toUpperCase();
                  const avatarColor = idx === 0 
                    ? "bg-[#B8A7EA] text-[#1E1E1E]" 
                    : idx === 1 
                    ? "bg-[#F578A0] text-[#1E1E1E]" 
                    : "bg-[#BED88D] text-[#1E1E1E]";

                  return (
                    <div 
                      key={prog.id}
                      onClick={() => onSelectProgram(prog.id)}
                      className="group/item flex items-center justify-between p-2 hover:bg-[#F7F5F0] rounded-xl cursor-pointer transition-all duration-150 border border-transparent hover:border-[#E8E5DC]"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                        {/* Rounded Avatar with Initials */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs transition-transform group-hover/item:scale-105",
                          avatarColor
                        )}>
                          {initials}
                        </div>

                        {/* Title & Metadata Hierarchy */}
                        <div className="flex flex-col min-w-0 truncate">
                          <span className="text-xs font-bold text-[#1E1E1E] truncate leading-tight group-hover/item:text-black">
                            {prog.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#1E1E1E]/60 font-medium">
                            <span className="bg-[#F7F5F0] px-1.5 py-0.2 rounded font-mono text-[9px] text-[#1E1E1E]/75">
                              {prog.cpp_standard}
                            </span>
                            <span>•</span>
                            <span className="truncate flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                              {formatDistanceToNow(new Date(prog.updated_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action / Star Icon */}
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {prog.is_favorite ? (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        ) : null}
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#F7F5F0] text-[#1E1E1E]/50 group-hover/item:bg-[#1E1E1E] group-hover/item:text-white transition-all shadow-2xs">
                          <ArrowRight className="w-3 h-3 group-hover/item:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div 
                  onClick={onOpenNewModal}
                  className="flex items-center gap-3 p-3 hover:bg-[#F7F5F0] rounded-xl cursor-pointer text-xs font-bold text-[#1E1E1E] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#B8A7EA] flex items-center justify-center text-white shadow-2xs">
                    <Plus className="w-4 h-4 text-[#1E1E1E]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E1E1E]">No programs in {inboxTab}</p>
                    <p className="text-[10px] text-[#1E1E1E]/60 font-normal">Tap to create your first C++ program</p>
                  </div>
                </div>
              )}

              {/* Footer drawer indicator for mobile */}
              {programs.length > 3 && (
                <div 
                  onClick={onOpenMobileSidebar}
                  className="pt-1.5 pb-0.5 text-center text-[10px] font-bold text-[#1E1E1E]/60 hover:text-[#1E1E1E] cursor-pointer transition-colors block md:hidden"
                >
                  View all {programs.length} programs in drawer →
                </div>
              )}
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 5. STANDARD LIBRARY / QUICK HEADERS (Peach)                               */}
          {/* ========================================================================= */}
          <div className="col-span-1 xl:col-span-2 bg-[#F4A076] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col xl:flex-row items-center justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group min-h-[260px]">
            {/* Ambient circle */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />

            {/* Left Copy */}
            <div className="w-full xl:w-1/2 z-10 xl:pr-6 mb-6 xl:mb-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/70 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">
                STL Modules
              </span>
              <h3 className="text-3xl sm:text-4xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight mt-2.5 leading-none">
                Standard Library
              </h3>
              <p className="text-sm font-medium text-[#1E1E1E]/85 mt-3 leading-relaxed">
                Explore key C++ standard library concepts with instant starter snippets and full standard conformance.
              </p>
              <div className="mt-4">
                <span className="text-xs font-bold text-[#1E1E1E] bg-white/50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E1E1E]" /> 
                  <span>Tap any module to open template</span>
                </span>
              </div>
            </div>

            {/* Right Visual: Grid of Colorful STL Header Cards */}
            <div className="w-full xl:w-1/2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <motion.div
                    key={tmpl.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onCreateProgram(tmpl.name, tmpl.content, tmpl.folder)}
                    className="h-16 sm:h-20 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer shadow-md transition-all relative overflow-hidden border border-white/20 active:scale-95"
                    style={{ backgroundColor: tmpl.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold tracking-wider uppercase truncate" style={{ color: tmpl.textColor }}>
                        {tmpl.badge}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight truncate" style={{ color: tmpl.textColor }}>
                      {tmpl.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 6. DIAGNOSTICS & STATIC ANALYSIS (Ice Sky Blue)                           */}
          {/* ========================================================================= */}
          <div className="bg-[#B0C8D9] rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5 group min-h-[260px]">
            {/* Top Copy */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1E1E1E]/70 bg-white/40 px-3 py-1 rounded-full">
                Diagnostics
              </span>
              <h3 className="text-2xl sm:text-3xl font-['Fraunces',serif] font-bold text-[#1E1E1E] tracking-tight mt-2.5 leading-none">
                Static Analysis
              </h3>
              <p className="text-sm font-medium text-[#1E1E1E]/80 mt-2 leading-snug">
                Zero compiler warnings, static_assert checks, and sanitizer validation.
              </p>
            </div>

            {/* Bottom Visual: Diagnostics Card */}
            <div className="mt-4 relative bg-[#1E1E1E] rounded-[24px] p-3 shadow-xl border border-white/20 text-white font-mono text-[11px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 text-[10px]">
                <span className="text-white/60 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>g++ build status</span>
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">CLEAN</span>
              </div>

              <div className="space-y-1 text-[10px] text-white/80">
                <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>0 errors • 0 warnings (-Wall)</span>
                </p>
                <p className="text-white/50 pl-4 text-[9px]">
                  ASan &amp; UBSan: No memory leaks detected
                </p>
                <p className="text-white/50 pl-4 text-[9px]">
                  Concepts: Full ISO conformance
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
