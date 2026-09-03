import { Program, RunResult } from '../types';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

const LOCAL_STORAGE_KEY = 'airus_local_programs';

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
        "Direct C++ one-liner evaluation",
        "Multi-terminal tabs",
        "Modern C++23 standards support"
    };

    for (const auto& feat : features) {
        cout << "  • " << feat << endl;
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

function getLocalPrograms(): Program[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PROGRAMS));
      return DEFAULT_PROGRAMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROGRAMS;
  }
}

function saveLocalPrograms(programs: Program[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(programs));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export async function fetchPrograms(): Promise<Program[]> {
  try {
    const res = await fetch(`${API_URL}/api/programs`);
    if (!res.ok) throw new Error('Failed to fetch programs from server');
    const data = await res.json();
    saveLocalPrograms(data);
    return data;
  } catch (err) {
    console.warn('Backend API unreachable, using local persistent storage fallback:', err);
    return getLocalPrograms();
  }
}

export async function fetchProgram(id: string): Promise<Program> {
  try {
    const res = await fetch(`${API_URL}/api/programs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch program from server');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using local storage fallback for file:', id);
    const progs = getLocalPrograms();
    const found = progs.find(p => p.id === id);
    if (!found) throw new Error('Program not found in local storage');
    return found;
  }
}

export async function createProgram(name: string, content?: string, folder?: string): Promise<Program> {
  try {
    const res = await fetch(`${API_URL}/api/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, folder }),
    });
    if (!res.ok) throw new Error('Failed to create program on server');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, creating program in local storage:', err);
    const progs = getLocalPrograms();
    const newProg: Program = {
      id: `local_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      source_path: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_opened_at: new Date().toISOString(),
      is_favorite: 0,
      compiler: 'g++',
      cpp_standard: 'C++23',
      folder: folder || 'src/scratchpad',
      content: content || `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}\n`
    };
    saveLocalPrograms([newProg, ...progs]);
    return newProg;
  }
}

export async function updateProgram(id: string, updates: Partial<Program>): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/programs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update program on server');
  } catch (err) {
    console.warn('Backend API unreachable, updating local storage copy:', err);
  } finally {
    const progs = getLocalPrograms();
    const updated = progs.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
    saveLocalPrograms(updated);
  }
}

export async function deleteProgram(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/programs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete program on server');
  } catch (err) {
    console.warn('Backend API unreachable, deleting from local storage:', err);
  } finally {
    const progs = getLocalPrograms();
    saveLocalPrograms(progs.filter(p => p.id !== id));
  }
}

export async function runProgram(id: string): Promise<RunResult> {
  try {
    const res = await fetch(`${API_URL}/api/programs/${id}/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run program');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      compileOutput: `[AiRus Hosting Notice]\nBackend server is unreachable (${String(err)}).\n\nIf you are hosting statically on GitHub Pages, native C++ compilation via g++ requires an active backend server.\n\nTo enable full live compilation:\n1. Deploy the backend to Google Cloud Run, Render, or Railway.\n2. Set the VITE_API_URL environment variable to your backend URL.`,
      runOutput: '',
      exitCode: 1,
      timeMs: 0
    };
  }
}

export async function runSnippet(snippet: string, cppStandard: string = 'c++23'): Promise<RunResult> {
  try {
    const res = await fetch(`${API_URL}/api/run-snippet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snippet, cpp_standard: cppStandard }),
    });
    if (!res.ok) throw new Error('Failed to execute snippet');
    return await res.json();
  } catch (err) {
    return {
      success: false,
      compileOutput: `[AiRus Hosting Notice]\nBackend server is unreachable (${String(err)}).\nIn static hosting mode (GitHub Pages), set VITE_API_URL to your backend to run C++ code live.`,
      runOutput: '',
      exitCode: 1,
      timeMs: 0
    };
  }
}
