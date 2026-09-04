import { Program, RunResult } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const LOCAL_STORAGE_KEY = 'airus_local_programs';
const DELETED_IDS_KEY = 'airus_deleted_program_ids';

const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'starter_hello',
    name: 'hello_world.cpp',
    slug: 'hello-world',
    source_path: 'hello_world.cpp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
    is_favorite: 1,
    compiler: 'g++',
    cpp_standard: 'C++23',
    folder: 'src/examples',
    content: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Welcome to AiRus Compiler (ISO C++23)!" << endl;
    
    vector<string> features = {
        "Blazing-fast g++ compilation",
        "Full standard input (cin/scanf) support",
        "Per-file terminal run history",
        "Permanent cloud & local synchronization",
        "Direct C++ expression evaluation"
    };

    for (const auto& feat : features) {
        cout << "  • " << feat << endl;
    }

    return 0;
}
`
  },
  {
    id: 'starter_input_demo',
    name: 'user_input.cpp',
    slug: 'user-input',
    source_path: 'user_input.cpp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
    is_favorite: 1,
    compiler: 'g++',
    cpp_standard: 'C++23',
    folder: 'src/examples',
    content: `#include <iostream>
#include <string>

using namespace std;

int main() {
    int length, width;
    cout << "Enter length and width: " << endl;
    if (cin >> length >> width) {
        int area = length * width;
        int perimeter = 2 * (length + width);
        cout << "Calculated Area: " << area << endl;
        cout << "Calculated Perimeter: " << perimeter << endl;
    } else {
        cout << "Notice: Enter inputs in the 'Input (stdin)' tab below." << endl;
    }
    return 0;
}
`
  },
  {
    id: 'starter_algo',
    name: 'binary_search.cpp',
    slug: 'binary-search',
    source_path: 'binary_search.cpp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
    is_favorite: 0,
    compiler: 'g++',
    cpp_standard: 'C++23',
    folder: 'src/algorithms',
    content: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> nums = {4, 8, 15, 16, 23, 42, 55, 68, 79, 90};
    int target = 42;

    auto it = lower_bound(nums.begin(), nums.end(), target);

    if (it != nums.end() && *it == target) {
        cout << "Found " << target << " at index " << distance(nums.begin(), it) << endl;
    } else {
        cout << target << " not found in array" << endl;
    }

    return 0;
}
`
  }
];

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addDeletedId(id: string) {
  try {
    const set = getDeletedIds();
    set.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save deleted ID', err);
  }
}

function getLocalPrograms(): Program[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PROGRAMS));
      return DEFAULT_PROGRAMS;
    }
    const parsed: Program[] = JSON.parse(raw);
    const deleted = getDeletedIds();
    return parsed.filter(p => !deleted.has(p.id));
  } catch {
    return DEFAULT_PROGRAMS;
  }
}

function saveLocalPrograms(programs: Program[]) {
  try {
    const deleted = getDeletedIds();
    const clean = programs.filter(p => !deleted.has(p.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

// Full bidirectional sync to keep data permanent across container redeploys
export async function fetchPrograms(): Promise<Program[]> {
  const local = getLocalPrograms();
  const deleted = getDeletedIds();

  try {
    const res = await fetch(`${API_URL}/api/programs`);
    if (!res.ok) throw new Error('Failed to fetch programs from server');
    const serverPrograms: Program[] = await res.json();

    // Map existing server items
    const serverMap = new Map(serverPrograms.map(p => [p.id, p]));
    const needsUpload: Program[] = [];

    // Check if local programs need to be restored to server (e.g. after fresh Render deploy)
    for (const lp of local) {
      if (!deleted.has(lp.id) && !serverMap.has(lp.id)) {
        needsUpload.push(lp);
      }
    }

    if (needsUpload.length > 0) {
      try {
        await fetch(`${API_URL}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programs: local })
        });
      } catch (syncErr) {
        console.warn('Sync upload notice:', syncErr);
      }
    }

    // Merge server with local updates
    const mergedMap = new Map<string, Program>();
    for (const lp of local) {
      if (!deleted.has(lp.id)) mergedMap.set(lp.id, lp);
    }
    for (const sp of serverPrograms) {
      if (!deleted.has(sp.id)) {
        const localItem = mergedMap.get(sp.id);
        if (!localItem || new Date(sp.updated_at).getTime() >= new Date(localItem.updated_at).getTime()) {
          mergedMap.set(sp.id, { ...localItem, ...sp });
        }
      }
    }

    const merged = Array.from(mergedMap.values());
    saveLocalPrograms(merged);
    return merged;
  } catch (err) {
    console.warn('Backend API unreachable or offline, using permanent local storage:', err);
    return local;
  }
}

export async function fetchProgram(id: string): Promise<Program> {
  const local = getLocalPrograms();
  const foundLocal = local.find(p => p.id === id);

  try {
    const res = await fetch(`${API_URL}/api/programs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch program from server');
    const serverData = await res.json();
    
    // If local has more recent edit, keep local content
    if (foundLocal && foundLocal.content && (!serverData.content || new Date(foundLocal.updated_at).getTime() > new Date(serverData.updated_at).getTime())) {
      return foundLocal;
    }
    
    if (foundLocal) {
      const updated = { ...foundLocal, ...serverData };
      saveLocalPrograms(local.map(p => p.id === id ? updated : p));
      return updated;
    }
    return serverData;
  } catch (err) {
    if (foundLocal) return foundLocal;
    throw new Error('Program not found');
  }
}

export async function createProgram(name: string, content?: string, folder?: string): Promise<Program> {
  const id = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const newProg: Program = {
    id,
    name,
    slug,
    source_path: `${slug}-${id}.cpp`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_opened_at: new Date().toISOString(),
    is_favorite: 0,
    compiler: 'g++',
    cpp_standard: 'C++23',
    folder: folder || 'src/scratchpad',
    content: content || `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`
  };

  // 1. Immediately save to browser permanent storage
  const current = getLocalPrograms();
  saveLocalPrograms([newProg, ...current]);

  // 2. Sync to backend
  try {
    await fetch(`${API_URL}/api/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newProg.id,
        name: newProg.name,
        content: newProg.content,
        folder: newProg.folder
      }),
    });
  } catch (err) {
    console.warn('Backend currently offline, created in persistent local store:', err);
  }

  return newProg;
}

export async function updateProgram(id: string, updates: Partial<Program>): Promise<void> {
  // 1. Immediately update browser storage
  const progs = getLocalPrograms();
  let updatedContent = '';
  const updatedList = progs.map(p => {
    if (p.id === id) {
      const merged = { ...p, ...updates, updated_at: new Date().toISOString() };
      updatedContent = merged.content || '';
      return merged;
    }
    return p;
  });
  saveLocalPrograms(updatedList);

  // 2. Sync to server
  try {
    await fetch(`${API_URL}/api/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('Backend sync deferred, saved to persistent local storage:', err);
  }
}

export async function deleteProgram(id: string): Promise<void> {
  // 1. Mark as permanently deleted
  addDeletedId(id);
  const progs = getLocalPrograms();
  saveLocalPrograms(progs.filter(p => p.id !== id));

  // 2. Delete from server
  try {
    await fetch(`${API_URL}/api/programs/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend offline, deleted locally:', err);
  }
}

export async function runProgram(id: string, stdin?: string, content?: string): Promise<RunResult> {
  try {
    const res = await fetch(`${API_URL}/api/programs/${id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stdin, content })
    });
    if (!res.ok) throw new Error('Failed to run program');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      compileOutput: `[AiRus Compiler Notice]\nBackend server is unreachable (${String(err)}).\n\nPlease verify that your Render backend is running at:\n${API_URL || 'https://cppcompilerv2.onrender.com'}`,
      runOutput: '',
      exitCode: 1,
      timeMs: 0
    };
  }
}

export async function runSnippet(snippet: string, cppStandard: string = 'c++23', stdin?: string): Promise<RunResult> {
  try {
    const res = await fetch(`${API_URL}/api/run-snippet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snippet, cpp_standard: cppStandard, stdin }),
    });
    if (!res.ok) throw new Error('Failed to execute snippet');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      compileOutput: `[AiRus Compiler Notice]\nBackend server is unreachable (${String(err)}).`,
      runOutput: '',
      exitCode: 1,
      timeMs: 0
    };
  }
}
