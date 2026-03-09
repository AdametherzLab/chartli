import * as fs from "fs";
import * as path from "path";
import type { ChartOptions, ChartType, ColorScheme, ParsedData, RenderResult } from "./types.js";
import { parseInput } from "./parse.js";
import { renderBar, renderSpark, renderHeatmap, renderBraille, renderColumn, renderToSvg } from "./renderers.js";
import { startExplorer } from "./explorer.js";

const VALID_CHART_TYPES: readonly ChartType[] = ["bar", "column", "spark", "heatmap", "braille"];
const VALID_COLOR_SCHEMES: readonly ColorScheme[] = [
  "auto", "none", "red", "green", "yellow", "blue", "magenta", "cyan", "white"
];

interface CliArguments extends ChartOptions {
  readonly positional?: string;
  readonly interactive?: boolean;
}

function renderChart(data: ParsedData, options: ChartOptions): RenderResult {
  const chartType = options.chartType ?? "bar";
  switch (chartType) {
    case "bar": return renderBar(data.values, options);
    case "column": return renderColumn(data.values, options);
    case "spark": return renderSpark(data.values, options);
    case "heatmap": return renderHeatmap(data.values, options);
    case "braille": return renderBraille(data.values, options);
    default: return renderBar(data.values, options);
  }
}

/**
 * Execute the chartli CLI with the provided arguments.
 * Parses flags, validates inputs, renders the chart, and handles output.
 * @param argv - Command-line arguments excluding node/bun executable and script path (typically process.argv.slice(2))
 * @returns void
 * @throws {Error} If argument validation fails, input cannot be parsed, or file operations fail
 * @example
 * // Render bar chart from file
 * runCli(["--type", "bar", "data.csv"]);
 *
 * // Interactive explorer mode
 * runCli(["--interactive", "data.csv"]);
 *
 * // Render with custom width and save SVG
 * runCli(["--width", "60", "--svg", "out.svg", "--title", "Sales"]);
 */
export async function runCli(argv: readonly string[]): Promise<void> {
  try {
    const args = parseArguments(argv);
    const { positional, interactive, ...chartOptions } = args;

    const inputPath = positional ?? undefined;
    const parsedData: ParsedData = await parseInput(inputPath);

    if (interactive) {
      await startExplorer(parsedData, chartOptions);
      return;
    }

    const result: RenderResult = renderChart(parsedData, chartOptions);

    // Output terminal visualization
    console.log(result.terminal);

    // Write SVG if requested
    if (chartOptions.svgOutputPath) {
      const svg = renderToSvg(parsedData.values, chartOptions, chartOptions.chartType ?? "bar");
      const resolvedPath = path.resolve(chartOptions.svgOutputPath);
      fs.writeFileSync(resolvedPath, svg, "utf-8");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`chartli: ${message}`);
    process.exit(1);
  }
}

function parseArguments(argv: readonly string[]): CliArguments {
  const args = [...argv];
  let chartType: ChartType | undefined;
  let width: number | undefined;
  let color: ColorScheme | undefined;
  let svgOutputPath: string | undefined;
  let title: string | undefined;
  let interactive = false;
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--type" || arg === "-t") {
      const value = args[++i];
      if (!value) throw new Error("Missing value for --type flag");
      if (!VALID_CHART_TYPES.includes(value as ChartType)) {
        throw new Error(
          `Invalid chart type '${value}'. Valid types: ${VALID_CHART_TYPES.join(", ")}`
        );
      }
      chartType = value as ChartType;
    } else if (arg === "--width" || arg === "-w") {
      const value = args[++i];
      if (!value) throw new Error("Missing value for --width flag");
      const parsed = parseInt(value, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new RangeError(`Width must be a positive integer, got '${value}'`);
      }
      width = parsed;
    } else if (arg === "--color" || arg === "-c") {
      const value = args[++i];
      if (!value) throw new Error("Missing value for --color flag");
      if (!VALID_COLOR_SCHEMES.includes(value as ColorScheme)) {
        throw new Error(
          `Invalid color scheme '${value}'. Valid schemes: ${VALID_COLOR_SCHEMES.join(", ")}`
        );
      }
      color = value as ColorScheme;
    } else if (arg === "--svg") {
      const value = args[++i];
      if (!value) throw new Error("Missing value for --svg flag");
      svgOutputPath = value;
    } else if (arg === "--title") {
      const value = args[++i];
      if (!value) throw new Error("Missing value for --title flag");
      title = value;
    } else if (arg === "--interactive" || arg === "-i") {
      interactive = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  if (positionals.length > 1) {
    throw new Error(
      `Expected at most 1 file argument, received ${positionals.length}: ${positionals.join(", ")}`
    );
  }

  return {
    chartType: chartType ?? "bar",
    width,
    color,
    title,
    svgOutputPath,
    interactive,
    positional: positionals[0]
  } satisfies CliArguments;
}

// Auto-execute when run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     import.meta.url === process.argv[1];

if (isMainModule) {
  runCli(process.argv.slice(2));
}
