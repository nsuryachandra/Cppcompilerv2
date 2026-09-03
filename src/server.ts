import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';
import { initDb, dbAll, dbGet, dbRun } from './db.js';
import { createServer as createViteServer } from 'vite';

const execPromise = util.promisify(exec);

const PORT = 3000;
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace', 'programs');

// Ensure programs directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

async function startServer() {
  await initDb();
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/programs', async (req, res) => {
    try {
      const programs = await dbAll(`SELECT * FROM programs WHERE deleted_at IS NULL ORDER BY updated_at DESC`);
      res.json(programs);
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
      const program = await dbGet<any>('SELECT * FROM programs WHERE id = ?', [req.params.id]);
      if (!program) return res.status(404).json({ error: 'Not found' });

      const fullPath = path.join(WORKSPACE_DIR, program.source_path);
      if (!fs.existsSync(fullPath)) {
        return res.status(400).json({ error: 'Source file missing' });
      }

      const binPath = path.join(WORKSPACE_DIR, program.id + '.out');
      
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
        // Fallback simulated response or graceful failure
        result.compileOutput = "g++ compiler is not available in the current environment.\nWait for installation to complete, or contact support.";
        return res.json(result);
      }

      const start = Date.now();
      
      // Compile
      try {
        await execPromise(`g++ -std=${program.cpp_standard.toLowerCase()} "${fullPath}" -o "${binPath}"`);
      } catch (compileErr: any) {
        result.compileOutput = compileErr.stderr || compileErr.stdout || String(compileErr);
        result.timeMs = Date.now() - start;
        return res.json(result);
      }

      result.compileOutput = 'Success';

      // Run
      try {
        const { stdout, stderr } = await execPromise(`"${binPath}"`, { timeout: 5000 });
        result.success = true;
        result.runOutput = stdout + stderr;
        result.exitCode = 0;
      } catch (runErr: any) {
        result.success = false;
        result.runOutput = runErr.stdout + runErr.stderr;
        result.exitCode = runErr.code || 1;
      }

      result.timeMs = Date.now() - start;

      // Log run in DB
      await dbRun(
        `INSERT INTO runs (id, program_id, status, exit_code, output, execution_time_ms) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), program.id, result.success ? 'success' : 'error', result.exitCode, result.runOutput, result.timeMs]
      );

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Direct C++ Snippet Runner (for interactive terminal)
  app.post('/api/run-snippet', async (req, res) => {
    try {
      const { snippet, cpp_standard } = req.body;
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

      try {
        const { stdout, stderr } = await execPromise(`"${binPath}"`, { timeout: 5000 });
        result.success = true;
        result.runOutput = stdout + stderr;
        result.exitCode = 0;
      } catch (runErr: any) {
        result.success = false;
        result.runOutput = (runErr.stdout || '') + (runErr.stderr || '');
        result.exitCode = runErr.code || 1;
      }

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
