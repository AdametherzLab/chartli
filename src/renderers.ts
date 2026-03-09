import * as path from "path";
import type { ChartOptions, RenderResult, ChartType, ColorScheme } from "./types.js";

const ANSI_COLORS: Record<Exclude<ColorScheme, "auto" | "none">, string> = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
} as const;

const ANSI_RESET = "\x1b[0m";

function validateValues(values: readonly number[]): void {
  if (values.length === 0) throw new RangeError("Cannot render chart with empty values array");
  if (values.some(v => !Number.isFinite(v))) throw new TypeError("Values must be finite numbers, not NaN or Infinity");
}

function applyColor(text: string, color?: ColorScheme): string {
  if (!color || color === "none" || color === "auto") return text;
  const code = ANSI_COLORS[color];
  return code ? `${code}${text}${ANSI_RESET}` : text;
}

function scaleValues(values: readonly number[], max: number): number[] {
  const min = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - min;
  if (range === 0) return values.map(() => 0);
  return values.map(v => Math.round(((v - min) / range) * max));
}

function getTitlePrefix(options: ChartOptions): string {
  return options.title ? `${options.title}\n` : "";
}

/**
 * Generate SVG markup for the provided data and chart type.
 * @param values - Array of numeric values to visualize
 * @param options - Configuration containing width constraints
 * @param chartType - Type of chart to generate
 * @returns SVG string suitable for embedding in HTML or documents
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderToSvg(values: readonly number[], options: ChartOptions, chartType: ChartType): string {
  validateValues(values);
  const width = options.width ?? 800;
  const height = 400;
  const padding = 40;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const maxVal = Math.max(...values);
  
  let content = "";
  if (chartType === "bar" || chartType === "column") {
    const barW = chartW / values.length;
    content = values.map((v, i) => {
      const barH = (v / maxVal) * chartH;
      const x = padding + i * barW;
      const y = height - padding - barH;
      return `<rect x="${x}" y="${y}" width="${barW * 0.8}" height="${barH}" fill="steelblue"/>`;
    }).join("");
  } else {
    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * chartW;
      const y = height - padding - ((v / maxVal) * chartH);
      return `${x},${y}`;
    }).join(" ");
    content = `<polyline points="${points}" fill="none" stroke="steelblue" stroke-width="2"/>`;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`;
}

/**
 * Render a horizontal bar chart using Unicode block characters.
 * @param values - Array of numeric values to chart
 * @param options - Configuration for rendering
 * @returns RenderResult with terminal string and optional SVG
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderBar(values: readonly number[], options: ChartOptions): RenderResult {
  validateValues(values);
  const width = options.width ?? 60;
  const scaled = scaleValues(values, width);
  const bars = scaled.map(len => applyColor("█".repeat(Math.max(0, len)), options.color));
  const terminal = getTitlePrefix(options) + bars.join("\n");
  const svg = options.svgOutputPath ? renderToSvg(values, options, "bar") : undefined;
  return { terminal, svg };
}

/**
 * Render a single-line sparkline using Unicode block characters (▁▂▃▄▅▆▇█).
 * @param values - Array of numeric values to chart
 * @param options - Configuration for rendering
 * @returns RenderResult with terminal string and optional SVG
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderSpark(values: readonly number[], options: ChartOptions): RenderResult {
  validateValues(values);
  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const scaled = scaleValues(values, blocks.length - 1);
  const line = scaled.map(idx => blocks[idx]).join("");
  const terminal = getTitlePrefix(options) + applyColor(line, options.color);
  const svg = options.svgOutputPath ? renderToSvg(values, options, "spark") : undefined;
  return { terminal, svg };
}

/**
 * Render a 2D heatmap grid using density characters (░▒▓█).
 * @param values - Array of numeric values to chart
 * @param options - Configuration for rendering
 * @returns RenderResult with terminal string and optional SVG
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderHeatmap(values: readonly number[], options: ChartOptions): RenderResult {
  validateValues(values);
  const cols = Math.min(options.width ?? 10, values.length);
  const rows = Math.ceil(values.length / cols);
  const maxVal = Math.max(...values);
  const density = [" ", "░", "▒", "▓", "█"];
  const grid: string[] = [];
  
  for (let r = 0; r < rows; r++) {
    const rowValues = values.slice(r * cols, (r + 1) * cols);
    const rowStr = rowValues.map(v => {
      const idx = Math.min(density.length - 1, Math.floor((v / maxVal) * (density.length - 1)));
      return applyColor(density[idx], options.color);
    }).join("");
    grid.push(rowStr);
  }
  
  const terminal = getTitlePrefix(options) + grid.join("\n");
  const svg = options.svgOutputPath ? renderToSvg(values, options, "heatmap") : undefined;
  return { terminal, svg };
}

/**
 * Render a high-resolution dot-matrix using Unicode Braille patterns (U+2800–U+28FF).
 * @param values - Array of numeric values to chart
 * @param options - Configuration for rendering
 * @returns RenderResult with terminal string and optional SVG
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderBraille(values: readonly number[], options: ChartOptions): RenderResult {
  validateValues(values);
  const width = options.width ?? 40;
  const scaled = scaleValues(values, 255);
  let line = "";
  for (let i = 0; i < scaled.length; i++) {
    line += String.fromCharCode(0x2800 + scaled[i]);
  }
  const terminal = getTitlePrefix(options) + applyColor(line.slice(0, width), options.color);
  const svg = options.svgOutputPath ? renderToSvg(values, options, "braille") : undefined;
  return { terminal, svg };
}

/**
 * Render a vertical column chart using Unicode block characters.
 * @param values - Array of numeric values to chart
 * @param options - Configuration for rendering
 * @returns RenderResult with terminal string and optional SVG
 * @throws {RangeError} If values array is empty
 * @throws {TypeError} If values contain non-finite numbers
 */
export function renderColumn(values: readonly number[], options: ChartOptions): RenderResult {
  validateValues(values);
  const height = 10;
  const scaled = scaleValues(values, height);
  const rows: string[] = [];
  
  for (let h = height; h > 0; h--) {
    const row = scaled.map(v => applyColor(v >= h ? "█" : " ", options.color)).join("");
    rows.push(row);
  }
  
  const terminal = getTitlePrefix(options) + rows.join("\n");
  const svg = options.svgOutputPath ? renderToSvg(values, options, "column") : undefined;
  return { terminal, svg };
}