import { describe, expect, test } from 'bun:test';
import { chunks, keepAnchors, mask, reject, rejectStrings, takeTitle, unmask } from '../lib/translate.js';

const page = '# Title\n\nUse `foo` in [List](../elements/list.md).\n\n> [!NOTE]\n> Hi\n\n```rust\n// a comment\nlet a = 1;\n```\n\n<!-- demo: x -->\n\n## Signals\n';

describe('mask', () => {
  test('hides code, links and comments, and restores them exactly', () => {
    const { text, kept } = mask(page);
    expect(text).not.toContain('foo');
    expect(text).not.toContain('list.md');
    expect(text).not.toContain('a comment');
    expect(text).not.toContain('demo:');
    expect(unmask(text, kept)).toBe(page);
  });
});

describe('reject', () => {
  const { text } = mask(page);
  test('accepts an answer with every token and the same headings', () => {
    expect(reject(text, text.replace('Signals', '시그널').replace('Title', '제목'))).toBeUndefined();
  });
  test('rejects a lost token', () => {
    expect(reject(text, text.replace('⟦0⟧', ''))).toBeDefined();
  });
  test('names the tokens lost or repeated', () => {
    expect(reject('⟦0⟧ a ⟦1⟧', '⟦0⟧ a ⟦0⟧')).toBe('masked parts changed: lost ⟦1⟧; repeated ⟦0⟧');
  });
  test('rejects changed headings', () => {
    expect(reject(text, text.replace('## Signals', 'Signals'))).toBeDefined();
  });
});

describe('keepAnchors', () => {
  test('gives a translated heading its English id', () => {
    expect(keepAnchors('## Signals', '## 시그널')).toBe('<a id="signals"></a>\n\n## 시그널');
  });
  test('leaves the page title first', () => {
    expect(keepAnchors('# Intro', '# 소개')).toBe('# 소개');
  });
  test('adds nothing when the id is the same', () => {
    expect(keepAnchors('## Signals', '## Signals')).toBe('## Signals');
  });
});

test('chunks keep all the text', () => {
  const text = Array.from({ length: 50 }, (_, i) => `## H${i}\n${'x'.repeat(1000)}`).join('\n');
  const pieces = chunks(text, 5000);
  expect(pieces.length).toBeGreaterThan(1);
  expect(pieces.join('\n')).toBe(text);
});

describe('takeTitle', () => {
  test('takes the leading title off and keeps what follows', () => {
    expect(takeTitle('\n# Input\n\nText.\n## A\n')).toEqual({ lead: '\n', titled: true, rest: '\nText.\n## A\n' });
  });
  test('leaves a page without a leading title alone', () => {
    expect(takeTitle('Text.\n# Later\n')).toEqual({ lead: '', titled: false, rest: 'Text.\n# Later\n' });
  });
});

describe('rejectStrings', () => {
  const source = { title: 'Home', stats: ['FPS', 'first frame'], cols: ['', 'TSX'], ways: [{ label: 'Apps', cta: 'Start' }] };
  test('accepts the same keys and lists, translated', () => {
    expect(rejectStrings(source, { title: 'ホーム', stats: ['FPS', '最初のフレーム'], cols: ['', 'TSX'], ways: [{ label: 'アプリ', cta: '始める' }] })).toBeUndefined();
  });
  test('rejects a missing or added key', () => {
    expect(rejectStrings(source, { ...source, title: undefined })).toBe('title is not a string');
    expect(rejectStrings({ a: 'x' }, {})).toBe('a is missing');
    expect(rejectStrings({ a: 'x' }, { a: 'y', b: 'z' })).toBe('the top has keys the input does not: b');
  });
  test('rejects a list of another length and a nested change', () => {
    expect(rejectStrings(source, { ...source, stats: ['FPS'] })).toBe('stats has 1 items instead of 2');
    expect(rejectStrings(source, { ...source, ways: [{ label: 'アプリ' }] })).toBe('ways[0].cta is missing');
  });
  test('rejects an emptied string and keeps an empty one empty', () => {
    expect(rejectStrings(source, { ...source, title: ' ' })).toBe('title is empty');
    expect(rejectStrings({ a: '' }, { a: '' })).toBeUndefined();
  });
});
