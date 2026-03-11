import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { parseArguments } from '../src/cli.js';
import { parseInput } from '../src/parse.js';
import { rm } from 'fs/promises';

describe('CLI File Handling', () => {
  const testFile = 'test-data.tmp';

  beforeEach(async () => {
    await Bun.write(testFile, '10\n20\n30');
  });

  afterEach(async () => {
    await rm(testFile, { force: true });
  });

  it('should parse positional file argument', () => {
    const args = [testFile];
    const result = parseArguments(args);
    expect(result.positional).toBe(testFile);
  });

  it('should read valid file input', async () => {
    const data = await parseInput(testFile);
    expect(data.values).toEqual([10, 20, 30]);
    expect(data.sourceFormat).toBe('plain');
  });

  it('should throw error for missing file', async () => {
    const missingFile = 'nonexistent.tmp';
    await expect(async () => parseInput(missingFile))
      .toThrow(`File not found: ${missingFile}`);
  });

  it('should handle complex CLI arguments with file', () => {
    const args = [
      '--type', 'spark',
      '--color', 'cyan',
      '--width', '80',
      testFile
    ];
    const result = parseArguments(args);
    expect(result).toEqual({
      chartType: 'spark',
      color: 'cyan',
      width: 80,
      interactive: false,
      positional: testFile,
      title: undefined,
      svgOutputPath: undefined
    });
  });
});