import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = join(process.cwd(), 'src');
const ALLOWED_CONSOLE_FILES = new Set([
  'logger/consoleLogger.ts',
  'utils/indexer.ts',
  'utils/object.ts',
]);

const listSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return listSourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
};

describe('no-console gate', () => {
  it('keeps direct console usage behind approved legacy/logger files', () => {
    const offenders = listSourceFiles(SRC_ROOT)
      .map((path) => ({
        path,
        rel: relative(SRC_ROOT, path),
        contents: readFileSync(path, 'utf8'),
      }))
      .filter(({ rel, contents }) => {
        return !ALLOWED_CONSOLE_FILES.has(rel) && /\bconsole\./.test(contents);
      })
      .map(({ rel }) => rel);

    expect(offenders).toEqual([]);
  });
});
