import { describe, it, expect } from "bun:test";
import { parseText, renderBar, renderSpark, renderToSvg } from "../src/index.js";
import { createExplorerState, applyKey, renderExplorerChart, buildStatusBar, buildFrame } from "../src/explorer.js";
import type { ChartOptions, ParsedData } from "../src/index.js";
import type { ExplorerState } from "../src/explorer.js";

describe("chartli public API", () => {
  it("parseText correctly parses plain whitespace-separated numbers into ParsedData with format 'plain'", () => {
    const input = "10 20 30 40 50";
    const result: ParsedData = parseText(input);
    expect(result.values).toEqual([10, 20, 30, 40, 50]);
    expect(result.sourceFormat).toBe("plain");
    expect(result.labels).toBeUndefined();
  });

  it("parseText correctly parses CSV string with header row into values and labels", () => {
    const input = "Month,Sales\nJan,100\nFeb,200\nMar,300";
    const result: ParsedData = parseText(input);
    expect(result.values).toEqual([100, 200, 300]);
    expect(result.labels).toEqual(["Jan", "Feb", "Mar"]);
    expect(result.sourceFormat).toBe("csv");
  });

  it("renderBar returns non-empty terminal string containing Unicode block characters for valid number array", () => {
    const values = [10, 20, 30, 40, 50];
    const options: ChartOptions = { width: 40 };
    const result = renderBar(values, options);
    expect(result.terminal).toBeDefined();
    expect(result.terminal.length).toBeGreaterThan(0);
    expect(result.terminal).toContain("█");
  });

  it("renderSpark returns single-line string for valid number array without title", () => {
    const values = [5, 10, 15, 20, 25];
    const options: ChartOptions = {};
    const result = renderSpark(values, options);
    expect(result.terminal).toBeDefined();
    expect(result.terminal.split("\n").length).toBe(1);
    expect(result.terminal.length).toBeGreaterThan(0);
  });

  it("renderToSvg returns string containing valid SVG opening and closing tags", () => {
    const values = [10, 20, 30, 40, 50];
    const options: ChartOptions = { width: 800 };
    const svg = renderToSvg(values, options, "bar");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});

describe("explorer state management", () => {
  it("createExplorerState returns correct defaults when no options provided", () => {
    const state = createExplorerState();
    expect(state.chartType).toBe("bar");
    expect(state.width).toBe(60);
    expect(state.color).toBe("auto");
    expect(state.typeIndex).toBe(0);
    expect(state.colorIndex).toBe(0);
    expect(state.title).toBe("");
  });

  it("createExplorerState respects provided options", () => {
    const state = createExplorerState({ chartType: "spark", width: 80, color: "cyan", title: "My Chart" });
    expect(state.chartType).toBe("spark");
    expect(state.width).toBe(80);
    expect(state.color).toBe("cyan");
    expect(state.title).toBe("My Chart");
    expect(state.typeIndex).toBe(2); // spark is index 2 in CHART_TYPES
    expect(state.colorIndex).toBe(7); // cyan is index 7 in COLOR_SCHEMES
  });

  it("createExplorerState clamps width to valid range", () => {
    const tooSmall = createExplorerState({ width: 3 });
    expect(tooSmall.width).toBe(10);
    const tooLarge = createExplorerState({ width: 500 });
    expect(tooLarge.width).toBe(200);
  });

  it("applyKey cycles chart type forward with 't'", () => {
    const state = createExplorerState();
    expect(state.chartType).toBe("bar");
    const next = applyKey(state, "t")!;
    expect(next).not.toBeNull();
    expect(next.chartType).toBe("column");
    expect(next.typeIndex).toBe(1);
  });

  it("applyKey cycles chart type backward with 'T'", () => {
    const state = createExplorerState();
    const next = applyKey(state, "T")!;
    expect(next.chartType).toBe("braille"); // wraps around to last
    expect(next.typeIndex).toBe(4);
  });

  it("applyKey increases width with 'w'", () => {
    const state = createExplorerState({ width: 60 });
    const next = applyKey(state, "w")!;
    expect(next.width).toBe(65);
  });

  it("applyKey decreases width with 'W'", () => {
    const state = createExplorerState({ width: 60 });
    const next = applyKey(state, "W")!;
    expect(next.width).toBe(55);
  });

  it("applyKey clamps width at minimum", () => {
    const state = createExplorerState({ width: 10 });
    const next = applyKey(state, "W")!;
    expect(next.width).toBe(10);
  });

  it("applyKey clamps width at maximum", () => {
    const state = createExplorerState({ width: 200 });
    const next = applyKey(state, "w")!;
    expect(next.width).toBe(200);
  });

  it("applyKey cycles color forward with 'c'", () => {
    const state = createExplorerState();
    const next = applyKey(state, "c")!;
    expect(next.color).toBe("none");
    expect(next.colorIndex).toBe(1);
  });

  it("applyKey cycles color backward with 'C'", () => {
    const state = createExplorerState();
    const next = applyKey(state, "C")!;
    expect(next.color).toBe("white"); // wraps to last
    expect(next.colorIndex).toBe(8);
  });

  it("applyKey returns null for quit key 'q'", () => {
    const state = createExplorerState();
    expect(applyKey(state, "q")).toBeNull();
    expect(applyKey(state, "Q")).toBeNull();
  });

  it("applyKey returns same state for unrecognized key", () => {
    const state = createExplorerState();
    const next = applyKey(state, "x");
    expect(next).toBe(state); // exact same reference
  });
});

describe("explorer rendering", () => {
  const testValues = [10, 20, 30, 40, 50];

  it("renderExplorerChart produces bar chart output for bar type", () => {
    const state = createExplorerState({ chartType: "bar", width: 40 });
    const result = renderExplorerChart(testValues, state);
    expect(result.terminal).toContain("█");
    expect(result.terminal.split("\n").length).toBeGreaterThan(1);
  });

  it("renderExplorerChart produces spark output for spark type", () => {
    const state = createExplorerState({ chartType: "spark" });
    const result = renderExplorerChart(testValues, state);
    expect(result.terminal).toBeDefined();
    expect(result.terminal.length).toBeGreaterThan(0);
  });

  it("renderExplorerChart produces column output for column type", () => {
    const state = createExplorerState({ chartType: "column" });
    const result = renderExplorerChart(testValues, state);
    expect(result.terminal).toContain("█");
  });

  it("buildStatusBar includes chart type, width, and color", () => {
    const state = createExplorerState({ chartType: "spark", width: 80, color: "cyan" });
    const bar = buildStatusBar(state);
    expect(bar).toContain("spark");
    expect(bar).toContain("80");
    expect(bar).toContain("cyan");
    expect(bar).toContain("quit");
  });

  it("buildFrame combines chart and status bar", () => {
    const state = createExplorerState({ chartType: "bar", width: 30 });
    const frame = buildFrame(testValues, state);
    expect(frame).toContain("█"); // chart content
    expect(frame).toContain("bar"); // status bar
    expect(frame).toContain("quit"); // help text
  });

  it("buildFrame includes title when set", () => {
    const state = createExplorerState({ chartType: "bar", width: 30, title: "Sales Data" });
    const frame = buildFrame(testValues, state);
    expect(frame).toContain("Sales Data");
  });

  it("full interaction sequence: type cycling renders different charts", () => {
    let state = createExplorerState({ width: 30 });
    const frames: string[] = [];

    // Collect frames for each chart type
    for (let i = 0; i < 5; i++) {
      frames.push(buildFrame(testValues, state));
      const next = applyKey(state, "t");
      if (next === null) break;
      state = next;
    }

    expect(frames.length).toBe(5);
    // Each frame should be different (different chart types produce different output)
    const unique = new Set(frames);
    expect(unique.size).toBe(5);
  });
});
