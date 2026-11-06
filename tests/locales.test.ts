import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const locales = JSON.parse(readFileSync(join(root, 'locales.json'), 'utf8')) as { code: string; name: string; dir?: string }[];
// The keys nsh.dev reads (`website/src/lib/locales.ts`) and the sidebar's labels.
const keys = ['notice', 'fallback', 'original', 'prev', 'next', 'toc', 'Docs', 'Elements', 'Start here', 'Platforms', 'Delivery and security', 'Building UI', 'Tools and internals', 'Primitives'];

describe('locales.json', () => {
  test('codes are unique and never the hand-written languages', () => {
    const codes = locales.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).not.toContain('en');
    expect(codes).not.toContain('zh-CN');
  });
  for (const { code, name, dir } of locales) {
    test(`${code} has a name, a direction and every UI string`, () => {
      expect(name.length).toBeGreaterThan(0);
      expect([undefined, 'ltr', 'rtl']).toContain(dir);
      const file = join(root, code, 'ui.json');
      expect(existsSync(file)).toBe(true);
      const ui = JSON.parse(readFileSync(file, 'utf8'));
      for (const key of keys) expect(typeof ui[key] === 'string' && ui[key].length > 0).toBe(true);
    });
  }
});
