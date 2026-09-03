import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FolderPlus, 
  ChevronsDownUp, 
  ChevronsUpDown, 
  Search, 
  Star, 
  Trash2, 
  X, 
  LayoutGrid, 
  Code2, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Program } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

interface SidebarProps {
  programs: Program[];
  activeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreateNew: (initialFolder?: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onHome?: () => void;
}

interface TreeNode {
  folderName: string;
  folderPath: string;
  files: Program[];
}

export function Sidebar({
  programs,
  activeId,
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
  onDelete,
  onToggleFavorite,
  onHome
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'starred'>('tree');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  // Filtered by search
  const filteredPrograms = useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.toLowerCase();
    return programs.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.folder && p.folder.toLowerCase().includes(q))
    );
  }, [programs, search]);

  // Build tree grouping
  const folderTree = useMemo(() => {
    const groups: Record<string, Program[]> = {};

    // Ensure standard default folders exist if there are matching programs or custom folders
    const knownFolders = [
      'src/algorithms',
      'src/data_structures',
      'src/modern_cpp',
      'src/concurrency',
      'src/benchmarks',
      'src/scratchpad',
      ...customFolders
    ];

    knownFolders.forEach(f => {
      groups[f] = [];
    });

    filteredPrograms.forEach(prog => {
      // Determine folder
      let folder = prog.folder;
      if (!folder) {
        // Infer intelligent default folder based on program name if not set
        const lower = prog.name.toLowerCase();
        if (lower.includes('sort') || lower.includes('search') || lower.includes('algo')) {
          folder = 'src/algorithms';
        } else if (lower.includes('tree') || lower.includes('bst') || lower.includes('cache') || lower.includes('lru') || lower.includes('graph')) {
          folder = 'src/data_structures';
        } else if (lower.includes('thread') || lower.includes('mutex') || lower.includes('concurrent') || lower.includes('worker')) {
          folder = 'src/concurrency';
        } else if (lower.includes('range') || lower.includes('c++20') || lower.includes('c++23') || lower.includes('view') || lower.includes('pipe')) {
          folder = 'src/modern_cpp';
        } else if (lower.includes('bench') || lower.includes('chrono') || lower.includes('clock') || lower.includes('speed')) {
          folder = 'src/benchmarks';
        } else {
          folder = 'src/scratchpad';
        }
      }

      if (!groups[folder]) {
        groups[folder] = [];
      }
      groups[folder].push(prog);
    });

    // Convert into list of non-empty folders or explicitly created custom folders
    const result: TreeNode[] = Object.entries(groups)
      .filter(([folderPath, files]) => files.length > 0 || customFolders.includes(folderPath))
      .map(([folderPath, files]) => {
        // Split clean name e.g. "src/algorithms" -> "algorithms"
        const parts = folderPath.split('/');
        const folderName = parts[parts.length - 1] || folderPath;
        return {
          folderName,
          folderPath,
          files: files.sort((a, b) => a.name.localeCompare(b.name))
        };
      })
      .sort((a, b) => a.folderPath.localeCompare(b.folderPath));

    return result;
  }, [filteredPrograms, customFolders]);

  const toggleFolder = (path: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCollapseAll = () => {
    const allCollapsed = folderTree.every(f => collapsedFolders[f.folderPath]);
    if (allCollapsed) {
      setCollapsedFolders({});
    } else {
      const next: Record<string, boolean> = {};
      folderTree.forEach(f => { next[f.folderPath] = true; });
      setCollapsedFolders(next);
    }
  };

  const handleAddCustomFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setIsCreatingFolder(false);
      return;
    }
    const cleanPath = `src/${newFolderName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
    if (!customFolders.includes(cleanPath)) {
      setCustomFolders(prev => [...prev, cleanPath]);
    }
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const starredPrograms = programs.filter(p => p.is_favorite === 1);

  return (
    <aside 
      className={cn(
        "fixed md:relative z-40 w-72 bg-white rounded-[28px] flex flex-col h-full overflow-hidden text-[#1E1E1E] transition-all duration-300 ease-in-out shadow-xs border border-[#EBE8DF]",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* 1. Sleek Brand Header */}
      <div className="p-4 pb-3 flex items-center justify-between shrink-0 bg-white border-b border-[#F4F2EB]">
        <div 
          onClick={onHome}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          title="Workspace Home"
        >
          <div className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center shadow-xs">
            <Code2 className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span className="font-['Fraunces',serif] text-base font-bold text-[#1E1E1E] leading-tight">
              AiRus
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#1E1E1E]/40 uppercase">
              COMPILER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onCreateNew()}
            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg transition-colors text-[#1E1E1E]"
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg transition-colors text-[#1E1E1E]"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#F7F5F0] rounded-lg transition-colors text-[#1E1E1E] md:hidden"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Workspace Overview & Navigation Bar */}
      <div className="p-3 pb-2 shrink-0 bg-white space-y-2">
        {/* Overview link */}
        <button
          onClick={onHome}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all",
            !activeId 
              ? "bg-[#1E1E1E] text-white shadow-xs" 
              : "bg-[#F7F5F0] text-[#1E1E1E] hover:bg-[#EBE8DF]"
          )}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Workspace Overview</span>
          </div>
          <span className="text-[10px] opacity-70 font-mono">Bento</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40" />
          <input 
            type="text" 
            placeholder="Filter files in tree..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7F5F0] border border-transparent focus:border-[#E0DDD3] rounded-xl py-1.5 pl-8 pr-7 text-xs font-medium focus:outline-none focus:bg-white transition-all placeholder:text-[#1E1E1E]/40 text-[#1E1E1E]"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 hover:text-[#1E1E1E]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View Mode Switcher: Tree vs Starred */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors",
                viewMode === 'tree' 
                  ? "bg-[#EBE8DF] text-[#1E1E1E]" 
                  : "text-[#1E1E1E]/50 hover:text-[#1E1E1E]"
              )}
            >
              Files ({programs.length})
            </button>
            <button
              onClick={() => setViewMode('starred')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors flex items-center gap-1",
                viewMode === 'starred' 
                  ? "bg-[#EBE8DF] text-[#1E1E1E]" 
                  : "text-[#1E1E1E]/50 hover:text-[#1E1E1E]"
              )}
            >
              <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
              <span>Starred ({starredPrograms.length})</span>
            </button>
          </div>

          {viewMode === 'tree' && (
            <button
              onClick={handleCollapseAll}
              className="text-[#1E1E1E]/40 hover:text-[#1E1E1E] p-1 rounded hover:bg-[#F7F5F0] transition-colors"
              title="Toggle Expand / Collapse All"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Main File Explorer Tree View */}
      <div className="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar text-xs">
        
        {/* Inline New Folder Input */}
        {isCreatingFolder && (
          <form onSubmit={handleAddCustomFolder} className="mb-2 px-2 pt-1">
            <div className="flex items-center gap-1 bg-[#F7F5F0] border border-[#E0DDD3] rounded-lg p-1">
              <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                placeholder="Folder name (e.g. tests)..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={() => {
                  if (!newFolderName.trim()) setIsCreatingFolder(false);
                }}
                className="w-full bg-transparent text-xs text-[#1E1E1E] font-medium focus:outline-none px-1"
              />
              <button 
                type="submit" 
                className="px-1.5 py-0.5 bg-[#1E1E1E] text-white rounded text-[10px] font-bold hover:bg-black"
              >
                Add
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreatingFolder(false)}
                className="text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </form>
        )}

        {viewMode === 'starred' ? (
          /* Starred List */
          <div className="space-y-1 py-1">
            {starredPrograms.length > 0 ? (
              starredPrograms.map(p => (
                <FileItem
                  key={p.id}
                  program={p}
                  isActive={activeId === p.id}
                  onSelect={() => onSelect(p.id)}
                  onDelete={() => onDelete(p.id)}
                  onToggleFav={() => onToggleFavorite(p.id, false)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#1E1E1E]/40 font-medium">
                No starred programs yet.
                <p className="text-[10px] mt-1 text-[#1E1E1E]/30">Click the star icon on any program to bookmark it here.</p>
              </div>
            )}
          </div>
        ) : (
          /* File Explorer Tree Structure */
          <div className="space-y-1 select-none">
            {/* Root workspace label */}
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-wider">
              <span>EXPLORER</span>
              <span className="text-[9px] font-mono lowercase opacity-75">src/</span>
            </div>

            {folderTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 px-4 text-center text-[#1E1E1E]/60">
                <div className="w-10 h-10 bg-[#F7F5F0] rounded-full flex items-center justify-center mb-3">
                  <FileCode2 className="w-5 h-5 text-[#1E1E1E]/60" />
                </div>
                <p className="text-xs font-semibold text-[#1E1E1E]">No matching files</p>
                <button 
                  onClick={() => onCreateNew()}
                  className="mt-3 px-3 py-1.5 bg-[#1E1E1E] text-white rounded-full text-[11px] font-semibold hover:bg-black transition-transform active:scale-95"
                >
                  + Create Program
                </button>
              </div>
            ) : (
              folderTree.map((node) => {
                const isCollapsed = collapsedFolders[node.folderPath];

                return (
                  <div key={node.folderPath} className="mb-0.5">
                    {/* Folder Header Row */}
                    <div 
                      className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#F7F5F0] cursor-pointer text-[#1E1E1E] transition-colors"
                      onClick={() => toggleFolder(node.folderPath)}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-[#1E1E1E]/40 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#1E1E1E]/40 shrink-0" />
                        )}
                        
                        {isCollapsed ? (
                          <Folder className="w-3.5 h-3.5 text-amber-600/80 shrink-0" />
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}

                        <span className="font-semibold text-xs text-[#1E1E1E] truncate">
                          {node.folderName}
                        </span>

                        <span className="text-[10px] text-[#1E1E1E]/40 font-mono ml-0.5">
                          ({node.files.length})
                        </span>
                      </div>

                      {/* Quick Add File in this folder on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNew(node.folderPath);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded text-[#1E1E1E]/60 hover:text-[#1E1E1E] transition-all"
                        title={`New file in ${node.folderName}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Children Files (Tree Indented with guide line) */}
                    {!isCollapsed && (
                      <div className="ml-3 pl-2.5 border-l border-[#EBE8DF] space-y-0.5 my-0.5">
                        {node.files.length === 0 ? (
                          <div 
                            onClick={() => onCreateNew(node.folderPath)}
                            className="py-1 px-2 text-[11px] text-[#1E1E1E]/40 italic hover:text-[#1E1E1E] cursor-pointer"
                          >
                            + Empty folder. Click to add file.
                          </div>
                        ) : (
                          node.files.map((file) => (
                            <FileItem
                              key={file.id}
                              program={file}
                              isActive={activeId === file.id}
                              onSelect={() => onSelect(file.id)}
                              onDelete={() => onDelete(file.id)}
                              onToggleFav={() => onToggleFavorite(file.id, !file.is_favorite)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Minimalist Footer Status */}
      <div className="px-4 py-2.5 bg-white border-t border-[#F4F2EB] flex items-center justify-between text-[10px] font-medium text-[#1E1E1E]/40 shrink-0">
        <span className="flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          GCC 12.3 Toolchain
        </span>
        <span className="font-mono">{programs.length} files</span>
      </div>
    </aside>
  );
}

interface FileItemProps {
  key?: React.Key;
  program: Program;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
}

function FileItem({ program, isActive, onSelect, onDelete, onToggleFav }: FileItemProps) {
  // Format filename to ensure .cpp is visible
  const fileName = program.name.endsWith('.cpp') || program.name.endsWith('.hpp') 
    ? program.name 
    : `${program.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.cpp`;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs",
        isActive 
          ? "bg-[#1E1E1E] text-white shadow-xs font-semibold" 
          : "hover:bg-[#F7F5F0] text-[#1E1E1E]/85 hover:text-[#1E1E1E]"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <span className={cn(
          "text-[9px] font-mono px-1 py-0.2 rounded font-bold shrink-0 uppercase",
          isActive 
            ? "bg-white/20 text-white" 
            : "bg-[#EBE8DF] text-[#1E1E1E]/70 group-hover:bg-[#E0DDD3]"
        )}>
          CPP
        </span>
        <span className="truncate leading-tight text-xs">
          {fileName}
        </span>
      </div>

      <div className={cn(
        "flex items-center gap-1 transition-opacity shrink-0 pl-1.5",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className={cn(
            "p-1 rounded hover:bg-black/10 transition-colors",
            program.is_favorite 
              ? "text-amber-400 opacity-100" 
              : "text-inherit hover:text-amber-400"
          )}
          title={program.is_favorite ? "Remove from starred" : "Add to starred"}
        >
          <Star className="w-3 h-3" fill={program.is_favorite ? "currentColor" : "none"} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "p-1 rounded transition-colors",
            isActive ? "hover:bg-white/20 text-white/80 hover:text-red-300" : "hover:bg-red-50 text-[#1E1E1E]/40 hover:text-red-600"
          )}
          title="Delete file"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
