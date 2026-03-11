import type { ChartOptions, ChartType, ColorScheme, ParsedData, RenderResult } from "./types.js";
import { renderBar, renderSpark, renderHeatmap, renderBraille, renderColumn } from "./renderers.js";
import { parseText } from "./parse.js";
import * as readline from "readline";

const CHART_TYPES: readonly ChartType[] = ["bar", "column", "spark", "heatmap", "braille"];
const COLOR_SCHEMES: readonly ColorScheme[] = ["auto", "none", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
const WIDTH_STEP = 5;
const MIN_WIDTH = 10;
const MAX_WIDTH = 200;

/**
 * Mutable state for the interactive chart explorer session.
 */
export interface ExplorerState {
  chartType: ChartType;
  width: number;
  color: ColorScheme;
  title: string;
  typeIndex: number;
  colorIndex: number;
}

/**
 * Create initial explorer state from optional chart options.
 * @param options - Starting chart options to seed state from
 * @returns Initialized ExplorerState
 */
export function createExplorerState(options?: Partial<ChartOptions>): ExplorerState {
  const chartType = options?.chartType ?? "bar";
  const color = options?.color ?? "auto";
  const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, options?.width ?? 60));
  return {
    chartType,
    width,
    color,
    title: options?.title ?? "",
    typeIndex: CHART_TYPES.indexOf(chartType) >= 0 ? CHART_TYPES.indexOf(chartType) : 0,
    colorIndex: COLOR_SCHEMES.indexOf(color) >= 0 ? COLOR_SCHEMES.indexOf(color) : 0,
  };
}

/**
 * Apply a keypress action to the explorer state immutably.
 * @param state - Current explorer state
 * @param key - Single-character key pressed by user
 * @returns New state after applying the action, or null if key is quit
 */
export function applyKey(state: ExplorerState, key: string): ExplorerState | null {
  if (key === "q" || key === "Q") return null;

  const next = { ...state };

  switch (key) {
    case "t": {
      next.typeIndex = (state.typeIndex + 1) % CHART_TYPES.length;
      next.chartType = CHART_TYPES[next.typeIndex];
      break;
    }
    case "T": {
      next.typeIndex = (state.typeIndex - 1 + CHART_TYPES.length) % CHART_TYPES.length;
      next.chartType = CHART_TYPES[next.typeIndex];
      break;
    }
    case "w": {
      next.width = Math.min(MAX_WIDTH, state.width + WIDTH_STEP);
      break;
    }
    case "W": {
      next.width = Math.max(MIN_WIDTH, state.width - WIDTH_STEP);
      break;
    }
    case "c": {
      next.colorIndex = (state.colorIndex + 1) % COLOR_SCHEMES.length;
      next.color = COLOR_SCHEMES[next.colorIndex];
      break;
    }
    case "C": {
      next.colorIndex = (state.colorIndex - 1 + COLOR_SCHEMES.length) % COLOR_SCHEMES.length;
      next.color = COLOR_SCHEMES[next.colorIndex];
      break;
    }
    default:
      return state;
  }

  return next;
}

/**
 * Read multi-line input from stdin until empty line or EOF.
 * Exported for testing purposes.
 * @returns Promise resolving to the input string
 */
export async function readInputContent(): Promise<string> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    rl.on("line", (line: string) => {
      if (line === "") {
        rl.close();
      } else {
        lines.push(line);
      }
    });
    
    rl.on("close", () => {
      resolve(lines.join("\n"));
    });
  });
}

/**
 * Process raw input text into ParsedData.
 * Exported for testing purposes.
 * @param input - Raw text input from user
 * @returns ParsedData or null if empty/invalid
 */
export function processInputData(input: string): ParsedData | null {
  if (!input.trim()) return null;
  try {
    return parseText(input);
  } catch {
    return null;
  }
}

/**
 * Render the chart for the current explorer state.
 * @param values - Numeric data to visualize
 * @param state - Current explorer state with chart parameters
 * @returns RenderResult containing the terminal output
 */
export function renderExplorerChart(values: readonly number[], state: ExplorerState): RenderResult {
  const options: ChartOptions = {
    width: state.width,
    color: state.color,
    title: state.title || undefined,
  };

  switch (state.chartType) {
    case "bar": return renderBar(values, options);
    case "column": return renderColumn(values, options);
    case "spark": return renderSpark(values, options);
    case "heatmap": return renderHeatmap(values, options);
    case "braille": return renderBraille(values, options);
    default: return renderBar(values, options);
  }
}

/**
 * Build the status bar string shown below the chart in interactive mode.
 * @param state - Current explorer state
 * @returns Formatted status bar string
 */
export function buildStatusBar(state: ExplorerState): string {
  const lines: string[] = [
    "",
    "\x1b[90m" + "─".repeat(60) + "\x1b[0m",
    `\x1b[1m  type:\x1b[0m ${state.chartType}  \x1b[1mwidth:\x1b[0m ${state.width}  \x1b[1mcolor:\x1b[0m ${state.color}`,
    `\x1b[90m  [t/T] type  [w/W] width ±${WIDTH_STEP}  [c/C] color  [i] input  [q] quit\x1b[0m`,
  ];
  return lines.join("\n");
}

/**
 * Build the complete interactive frame (chart + status bar).
 * @param values - Numeric data to visualize
 * @param state - Current explorer state
 * @returns Full terminal output string for one frame
 */
export function buildFrame(values: readonly number[], state: ExplorerState): string {
  const result = renderExplorerChart(values, state);
  return result.terminal + buildStatusBar(state);
}

/**
 * Start the interactive chart explorer in the terminal.
 * Reads keypresses in raw mode and re-renders the chart on each change.
 * Supports interactive data input via 'i' key.
 * @param data - Parsed data containing values and optional labels
 * @param initialOptions - Starting chart options
 * @returns Promise that resolves when the user quits (presses q)
 */
export async function startExplorer(data: ParsedData, initialOptions?: Partial<ChartOptions>): Promise<void> {
  if (!process.stdin.setRawMode) {
    console.error("chartli: interactive mode requires a TTY terminal");
    process.exit(1);
  }

  let state = createExplorerState(initialOptions);
  let currentValues = [...data.values];

  const clearAndRender = (): void => {
    // Clear screen and move cursor to top-left
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(buildFrame(currentValues, state) + "\n");
  };

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf-8");

  clearAndRender();

  return new Promise<void>((resolve) => {
    const onData = async (key: string): Promise<void> => {
      // Handle Ctrl+C
      if (key === "\x03") {
        cleanup();
        process.exit(0);
      }

      // Handle input mode
      if (key === "i" || key === "I") {
        process.stdout.write("\x1b[2J\x1b[H");
        process.stdout.write("\x1b[1mEnter/paste data (empty line to finish):\x1b[0m\n");
        process.stdin.setRawMode!(false);
        process.stdin.pause();
        
        const input = await readInputContent();
        
        process.stdin.setRawMode!(true);
        process.stdin.resume();
        
        const newData = processInputData(input);
        if (newData) {
          currentValues = [...newData.values];
        } else if (input.trim()) {
          // Show error for invalid input
          process.stdout.write("\x1b[31mError: Invalid data format\x1b[0m\n");
          await new Promise(r => setTimeout(r, 1500));
        }
        
        clearAndRender();
        return;
      }

      const nextState = applyKey(state, key);
      if (nextState === null) {
        cleanup();
        resolve();
        return;
      }

      if (nextState !== state) {
        state = nextState;
        clearAndRender();
      }
    };

    const cleanup = (): void => {
      process.stdin.setRawMode!(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      // Clear screen one final time and show exit message
      process.stdout.write("\x1b[2J\x1b[H");
    };

    process.stdin.on("data", onData);
  });
}
