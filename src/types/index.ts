export interface Program {
  id: string;
  name: string;
  slug: string;
  source_path: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  is_favorite: number;
  compiler: string;
  cpp_standard: string;
  folder?: string;
  content?: string;
}

export interface RunResult {
  success: boolean;
  compileOutput: string;
  runOutput: string;
  exitCode: number;
  timeMs: number;
}
