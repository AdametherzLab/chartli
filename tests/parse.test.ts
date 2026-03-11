import { describe, it, expect, mock } from 'bun:test';
import { parseInput, parseText } from '../src/parse.js';
import { Readable } from 'stream';

describe('parseInput', () => {
  it('should read from stdin when source is "-"', async () => {
    const mockStdin = new Readable({
      read() {
        this.push('5,10,15\n20,25,30');
        this.push(null);
      }
    });
    
    // @ts-ignore: Mocking stdin
    process.stdin = mockStdin;
    
    const result = await parseInput('-');
    expect(result.values).toEqual([5, 20, 25, 30]);
    expect(result.sourceFormat).toBe('csv');
  });

  it('should auto-detect stdin when no source provided', async () => {
    const mockStdin = new Readable({
      read() {
        this.push('10 20 30 40');
        this.push(null);
      }
    });

    // @ts-ignore: Mocking stdin
    process.stdin = mockStdin;
    // @ts-ignore: Simulate non-TTY environment
    process.stdin.isTTY = false;

    const result = await parseInput();
    expect(result.values).toEqual([10, 20, 30, 40]);
    expect(result.sourceFormat).toBe('plain');
  });
});

describe('parseText', () => {
  it('should parse multi-formatted input', () => {
    const inputs = [
      { text: '1\n2\n3', expected: [1, 2, 3], format: 'plain' },
      { text: 'A,B\n10,X\n20,Y', expected: [10, 20], format: 'csv' },
      { text: '[5,10,15]', expected: [5, 10, 15], format: 'json' }
    ];

    inputs.forEach(({ text, expected, format }) => {
      const result = parseText(text);
      expect(result.values).toEqual(expected);
      expect(result.sourceFormat).toBe(format);
    });
  });

  it('should throw error for invalid JSON', () => {
    expect(() => parseText('{ invalid: json }'))
      .toThrow('No numeric values found in input');
  });
});