import { describe, it, expect } from 'bun:test';
import { createExplorerState, applyKey, buildFrame } from '../src/explorer.js';

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
});
