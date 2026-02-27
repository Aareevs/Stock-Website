/**
 * generate_context.mjs
 * Regenerates codebase-context.md with all source files.
 * Run: node generate_context.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const OUTPUT = join(ROOT, 'codebase-context.md');

const INCLUDE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.md', '.html', '.sql'
]);

const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', '.gemini', '.vscode', '.idea', 'coverage'
]);

const EXCLUDE_FILES = new Set([
  'codebase-context.md', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'
]);

// Limit JSON files that are too large
const MAX_FILE_SIZE = 50_000; // 50KB

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        walk(join(dir, entry.name), files);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (INCLUDE_EXTENSIONS.has(ext) && !EXCLUDE_FILES.has(entry.name)) {
        const fullPath = join(dir, entry.name);
        const stat = statSync(fullPath);
        if (stat.size <= MAX_FILE_SIZE) {
          files.push(fullPath);
        }
      }
    }
  }
  return files;
}

const files = walk(ROOT).sort();
const langMap = {
  '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.mjs': 'javascript',
  '.css': 'css', '.json': 'json', '.md': 'markdown', '.html': 'html', '.sql': 'sql'
};

let output = `# Codebase Context\n\nThis file contains the full context of the codebase to be used by LLMs.\nGenerated at: ${new Date().toISOString()}\n\n`;

for (const f of files) {
  const rel = relative(ROOT, f);
  const ext = extname(f);
  const lang = langMap[ext] || '';
  const content = readFileSync(f, 'utf-8');
  output += `## File: \`${rel}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
}

writeFileSync(OUTPUT, output);
console.log(`✅ Generated ${OUTPUT}`);
console.log(`   ${files.length} files, ${(output.length / 1024).toFixed(1)} KB`);
