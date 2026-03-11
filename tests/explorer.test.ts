import { describe, it, expect } from 'bun:test';
import { createExplorerState, applyKey, buildFrame, buildStatusBar, processInputData, readInputContent } from '../src/explorer.js';
import { Readable } from 'stream';

describe('Interactive Data Explorer', () => {
  const testValues = [15, 30, 45, 60, 75];

  it('should cycle through all chart types with consistent rendering', () => {
    let state = createExplorerState();
    const frames = new Set();
    
    for (let i = 0; i < 5; i++) {
      frames.add(buildFrame(testValues, state).trim());
      state = applyKey(state, 't')!;
    }
    
    expect(frames.size).toBe(5);
  });

  it('should enforce width boundaries when adjusting size', () => {
    const minState = createExplorerState({ width: 10 });
    const maxState = createExplorerState({ width: 200 });
    
    expect(applyKey(minState, 'W')!.width).toBe(10);
    expect(applyKey(maxState, 'w')!.width).toBe(200);
  });

  it('should reflect color changes in status bar', () => {
    let state = createExplorerState();
    state = applyKey(state, 'c')!;
    let frame = buildFrame(testValues, state);
    
    expect(frame).toContain('color: none');
    
    state = applyKey(state, 'C')!;
    frame = buildFrame(testValues, state);
    expect(frame).toContain('color: auto');
  });

  it('should maintain state integrity after invalid keypress', () => {
    const initialState = createExplorerState({ width: 50 });
    const nextState = applyKey(initialState, 'x');
    
    expect(nextState).toBe(initialState);
    expect(nextState.width).toBe(50);
  });

  it('should handle full parameter modification cycle', () => {
    let state = createExplorerState();
    const initialFrame = buildFrame(testValues, state);
    
    // Change chart type
    state = applyKey(state, 't')!;
    // Increase width
    state = applyKey(state, 'w')!;
    // Change color
    state = applyKey(state, 'c')!;
    
    const modifiedFrame = buildFrame(testValues, state);
    
    expect(modifiedFrame).not.toBe(initialFrame);
    expect(modifiedFrame).toContain('column');
    expect(modifiedFrame).toContain('65');
    expect(modifiedFrame).toContain('none');
  });

  it('should display title when provided', () => {
    const state = createExplorerState({ title: 'Growth Metrics' });
    const frame = buildFrame(testValues, state);
    
    expect(frame).toContain('Growth Metrics');
    expect(frame.indexOf('Growth Metrics')).toBeLessThan(frame.indexOf('█'));
  });

  it('should clamp initial width values', () => {
    const lowState = createExplorerState({ width: 5 });
    const highState = createExplorerState({ width: 300 });
    
    expect(lowState.width).toBe(10);
    expect(highState.width).toBe(200);
  });

  it('should display input option in status bar', () => {
    const state = createExplorerState();
    const bar = buildStatusBar(state);
    expect(bar).toContain('[i]');
    expect(bar).toContain('input');
  });

  it('should process valid input data correctly', () => {
    const input = '10 20 30 40 50';
    const result = processInputData(input);
    expect(result).not.toBeNull();
    expect(result!.values).toEqual([10, 20, 30, 40, 50]);
    expect(result!.sourceFormat).toBe('plain');
  });

  it('should process CSV input data correctly', () => {
    const input = 'Month,Sales\nJan,100\nFeb,200\nMar,300';
    const result = processInputData(input);
    expect(result).not.toBeNull();
    expect(result!.values).toEqual([100, 200, 300]);
    expect(result!.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(result!.sourceFormat).toBe('csv');
  });

  it('should return null for invalid input data', () => {
    const input = 'not a number';
    const result = processInputData(input);
    expect(result).toBeNull();
  });

  it('should return null for empty input', () => {
    const input = '   ';
    const result = processInputData(input);
    expect(result).toBeNull();
  });

  it('should handle JSON array input', () => {
    const input = '[10, 20, 30, 40, 50]';
    const result = processInputData(input);
    expect(result).not.toBeNull();
    expect(result!.values).toEqual([10, 20, 30, 40, 50]);
    expect(result!.sourceFormat).toBe('json');
  });
});
