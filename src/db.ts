import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';

// Database is stored in the workspace root
const dbPath = path.join(process.cwd(), 'workspace', 'mycpp.db');

// Ensure workspace directory exists
const workspaceDir = path.dirname(dbPath);
if (!fs.existsSync(workspaceDir)) {
  fs.mkdirSync(workspaceDir, { recursive: true });
}

let db: any = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function initDb() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      source_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_favorite INTEGER DEFAULT 0,
      compiler TEXT DEFAULT 'g++',
      cpp_standard TEXT DEFAULT 'C++17',
      folder TEXT DEFAULT 'src/scratchpad',
      deleted_at DATETIME
    )
  `);

  try {
    db.run("ALTER TABLE programs ADD COLUMN folder TEXT DEFAULT 'src/scratchpad'");
  } catch (e) {
    // Column may already exist
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      status TEXT NOT NULL,
      exit_code INTEGER,
      output TEXT,
      execution_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(program_id) REFERENCES programs(id)
    )
  `);
  
  saveDb();
}

export function dbRun(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve) => {
    db.run(sql, params);
    saveDb();
    resolve(true);
  });
}

export function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve) => {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      resolve(row as unknown as T);
    } else {
      resolve(undefined);
    }
    stmt.free();
  });
}

export function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve) => {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) stmt.bind(params);
    
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    resolve(rows as unknown as T[]);
  });
}
