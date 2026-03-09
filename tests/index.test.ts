import { describe, it, expect } from "bun:test";
import { parseText, renderBar, renderSpark, renderToSvg } from "../src/index.js";
import type { ChartOptions, ParsedData } from "../src/index.js";

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