import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec, spawn } from 'child_process';
import util from 'util';
import { initDb, dbAll, dbGet, dbRun } from './db.js';
import { createServer as createViteServer } from 'vite';

const execPromise = util.promisify(exec);

const PORT = process.env.PORT || 3000;
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace', 'programs');

// Ensure programs directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

// Execute compiled binary with standard input (stdin) support
function executeBinary(binPath: string, stdinInput?: string, timeoutMs: number = 8000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isFinished = false;

    let child: any;
    try {
      child = spawn(binPath, [], { windowsHide: true });
    } catch (e: any) {
      return resolve({
        stdout: '',
        stderr: `Failed to spawn process: ${e.message || String(e)}`,
        exitCode: 1
      });
    }

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try { child.kill('SIGKILL'); } catch (_) {}
        resolve({
          stdout,
          stderr: stderr ? `${stderr}\n[Timeout: Execution exceeded 8s limit. If your code expects input with cin/scanf, please enter it in the 'Input (stdin)' tab before running.]` : `[Timeout: Execution exceeded 8s limit. If your code expects input with cin/scanf, please enter it in the 'Input (stdin)' tab before running.]`,
          exitCode: 124
        });
      }
    }, timeoutMs);

    if (child.stdin) {
      try {
        if (stdinInput && typeof stdinInput === 'string' && stdinInput.length > 0) {
          child.stdin.write(stdinInput);
          if (!stdinInput.endsWith('\n')) {
            child.stdin.write('\n');
          }
        }
        child.stdin.end();
      } catch (e) {
        // Stdin pipe closed
      }
    }

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString('utf-8');
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8');
    });

    child.on('error', (err: any) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: stderr ? `${stderr}\n${err.message || String(err)}` : (err.message || String(err)),
          exitCode: 1
        });
      }
    });

    child.on('close', (code: number | null) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0
        });
      }
    });
  });
}

async function startServer() {
  await initDb();
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/programs', async (req, res) => {
    try {
      const programs = await dbAll(`SELECT * FROM programs WHERE deleted_at IS NULL ORDER BY updated_at DESC`);
      res.json(programs);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Sync client-side persistent storage to server (survives container redeployments)
  app.post('/api/sync', async (req, res) => {
    try {
      const { programs } = req.body;
      if (!Array.isArray(programs)) {
        return res.status(400).json({ error: 'Expected programs array' });
      }

      for (const p of programs) {
        if (!p || !p.id || !p.name) continue;

        const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const fileName = p.source_path || `${slug}-${p.id.split('-')[0]}.cpp`;
        const sourcePath = path.join(WORKSPACE_DIR, fileName);

        if (p.content !== undefined) {
          fs.writeFileSync(sourcePath, p.content, 'utf-8');
        }

        const existing = await dbGet('SELECT id FROM programs WHERE id = ?', [p.id]);
        if (existing) {
          await dbRun(
            `UPDATE programs SET 
             name = ?, 
             slug = ?, 
             source_path = ?, 
             is_favorite = ?, 
             compiler = COALESCE(?, compiler), 
             cpp_standard = COALESCE(?, cpp_standard), 
             folder = COALESCE(?, folder), 
             updated_at = COALESCE(?, CURRENT_TIMESTAMP), 
             deleted_at = NULL 
             WHERE id = ?`,
            [p.name, slug, fileName, p.is_favorite ? 1 : 0, p.compiler || 'g++', p.cpp_standard || 'C++23', p.folder || 'src/scratchpad', p.updated_at || null, p.id]
          );
        } else {
          await dbRun(
            `INSERT INTO programs (id, name, slug, source_path, created_at, updated_at, last_opened_at, is_favorite, compiler, cpp_standard, folder) 
             VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?)`,
            [p.id, p.name, slug, fileName, p.created_at || null, p.updated_at || null, p.last_opened_at || null, p.is_favorite ? 1 : 0, p.compiler || 'g++', p.cpp_standard || 'C++23', p.folder || 'src/scratchpad']
          );
        }
      }

      const all = await dbAll(`SELECT * FROM programs WHERE deleted_at IS NULL ORDER BY updated_at DESC`);
      res.json(all);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/programs', async (req, res) => {
    try {
      const { name, content, folder } = req.body;
      const id = uuidv4();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const fileName = `${slug}-${id.split('-')[0]}.cpp`;
      const sourcePath = path.join(WORKSPACE_DIR, fileName);
      const programFolder = folder || 'src/scratchpad';

      const programContent = content || `#include <iostream>

using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`;
      // Write file
      fs.writeFileSync(sourcePath, programContent, 'utf-8');

      // Insert DB
      await dbRun(
        `INSERT INTO programs (id, name, slug, source_path, created_at, updated_at, last_opened_at, folder) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
        [id, name, slug, fileName, programFolder]
      );

      const newProgram = await dbGet('SELECT * FROM programs WHERE id = ?', [id]);
      res.json(newProgram);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/programs/:id', async (req, res) => {
    try {
      const program = await dbGet<any>('SELECT * FROM programs WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (!program) return res.status(404).json({ error: 'Not found' });
      
      const fullPath = path.join(WORKSPACE_DIR, program.source_path);
      let content = '';
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
      
      // Update last_opened_at
      await dbRun('UPDATE programs SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
      
      res.json({ ...program, content });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/programs/:id', async (req, res) => {
    try {
      const { name, content, is_favorite, folder } = req.body;
      const program = await dbGet<any>('SELECT * FROM programs WHERE id = ?', [req.params.id]);
      if (!program) return res.status(404).json({ error: 'Not found' });

      if (content !== undefined) {
        const fullPath = path.join(WORKSPACE_DIR, program.source_path);
        fs.writeFileSync(fullPath, content, 'utf-8');
      }

      await dbRun(
        `UPDATE programs SET 
         name = COALESCE(?, name), 
         is_favorite = COALESCE(?, is_favorite), 
         folder = COALESCE(?, folder), 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name !== undefined ? name : null, is_favorite !== undefined ? is_favorite : null, folder !== undefined ? folder : null, req.params.id]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/programs/:id', async (req, res) => {
    try {
      await dbRun('UPDATE programs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/programs/:id/run', async (req, res) => {
    try {
      const { stdin, content } = req.body;
      let program = await dbGet<any>('SELECT * FROM programs WHERE id = ?', [req.params.id]);
      
      const fileName = program ? program.source_path : `${req.params.id}.cpp`;
      const fullPath = path.join(WORKSPACE_DIR, fileName);

      // If content was supplied directly in request, write/update source file
      if (content !== undefined) {
        fs.writeFileSync(fullPath, content, 'utf-8');
      } else if (!fs.existsSync(fullPath)) {
        return res.status(400).json({ error: 'Source file missing' });
      }

      const cppStandard = program?.cpp_standard || 'C++23';
      const binPath = path.join(WORKSPACE_DIR, req.params.id + '.out');
      
      // Check for g++
      let hasGpp = false;
      try {
        await execPromise('g++ --version');
        hasGpp = true;
      } catch (e) {}

      let result = {
        success: false,
        compileOutput: '',
        runOutput: '',
        exitCode: 1,
        timeMs: 0
      };

      if (!hasGpp) {
        result.compileOutput = "g++ compiler is not available in the current environment.\nPlease ensure g++ is installed on the host.";
        return res.json(result);
      }

      const start = Date.now();
      
      // Compile
      try {
        await execPromise(`g++ -std=${cppStandard.toLowerCase()} "${fullPath}" -o "${binPath}"`);
      } catch (compileErr: any) {
        result.compileOutput = compileErr.stderr || compileErr.stdout || String(compileErr);
        result.timeMs = Date.now() - start;
        return res.json(result);
      }

      result.compileOutput = 'Success';

      // Run with Stdin Support!
      const execRes = await executeBinary(binPath, stdin, 10000);
      result.runOutput = execRes.stdout + (execRes.stderr ? (execRes.stdout ? '\n' : '') + execRes.stderr : '');
      result.exitCode = execRes.exitCode;
      result.success = execRes.exitCode === 0;
      result.timeMs = Date.now() - start;

      // Clean binary
      try { if (fs.existsSync(binPath)) fs.unlinkSync(binPath); } catch (_) {}

      // Log run in DB
      if (program) {
        await dbRun(
          `INSERT INTO runs (id, program_id, status, exit_code, output, execution_time_ms) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), program.id, result.success ? 'success' : 'error', result.exitCode, result.runOutput, result.timeMs]
        );
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Direct C++ Snippet Runner (for interactive terminal)
  app.post('/api/run-snippet', async (req, res) => {
    try {
      const { snippet, cpp_standard, stdin } = req.body;
      if (!snippet || typeof snippet !== 'string' || !snippet.trim()) {
        return res.status(400).json({ error: 'Snippet is required' });
      }

      const standard = cpp_standard || 'c++23';
      const snippetId = 'snippet_' + uuidv4().replace(/-/g, '').slice(0, 10);
      const sourcePath = path.join(WORKSPACE_DIR, `${snippetId}.cpp`);
      const binPath = path.join(WORKSPACE_DIR, `${snippetId}.out`);

      let formattedCode = snippet.trim();
      const hasMain = /\b(int|void|auto)\s+main\s*\(/.test(formattedCode);

      if (!hasMain) {
        // Check if it's a simple mathematical expression or variable without cout / statements
        const isSingleExpression = !formattedCode.includes(';') && 
                                   !formattedCode.includes('\n') && 
                                   !/\b(cout|cin|printf|for|while|if|switch|return|int|auto|double|float|char|string|bool|void|struct|class)\b/.test(formattedCode);

        let bodyCode = formattedCode;
        if (isSingleExpression) {
          bodyCode = `cout << (${formattedCode}) << endl;`;
        } else {
          if (!bodyCode.endsWith(';') && !bodyCode.endsWith('}')) {
            bodyCode += ';';
          }
        }

        formattedCode = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <memory>
#include <sstream>
#include <iomanip>

using namespace std;

int main() {
    ${bodyCode}
    return 0;
}
`;
      } else {
        if (!formattedCode.includes('#include')) {
          formattedCode = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
using namespace std;

` + formattedCode;
        }
      }

      fs.writeFileSync(sourcePath, formattedCode, 'utf-8');

      const start = Date.now();
      let result = {
        success: false,
        compileOutput: '',
        runOutput: '',
        exitCode: 1,
        timeMs: 0
      };

      try {
        await execPromise(`g++ -std=${standard.toLowerCase()} "${sourcePath}" -o "${binPath}"`);
      } catch (compileErr: any) {
        result.compileOutput = compileErr.stderr || compileErr.stdout || String(compileErr);
        result.timeMs = Date.now() - start;
        try { fs.unlinkSync(sourcePath); } catch (_) {}
        return res.json(result);
      }

      result.compileOutput = 'Success';

      // Run with Stdin Support
      const execRes = await executeBinary(binPath, stdin, 8000);
      result.runOutput = execRes.stdout + (execRes.stderr ? (execRes.stdout ? '\n' : '') + execRes.stderr : '');
      result.exitCode = execRes.exitCode;
      result.success = execRes.exitCode === 0;
      result.timeMs = Date.now() - start;

      try {
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
      } catch (_) {}

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
